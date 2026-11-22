import "server-only";
import { binanceSymbol, type PriceAsset } from "@/market-data";
import { binanceDailyCloses, tiingoDailyCloses, type HistoryClose } from "@/market-data/history";
import { mapLimited, retryTransient } from "@/market-data/http";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/*
 * Daily closes for the performance chart (decision 113), cached in
 * `price_history` and shared by every user:
 *  1. `price_history_sync` says, per asset, from which day the history is
 *     complete and when the provider was last asked;
 *  2. an asset is asked again only when the chart needs older days or the
 *     last ask is older than SYNC_EVERY_MS, and then only for the last few
 *     days (Tiingo's free plan allows 50 requests per hour);
 *  3. closes are saved with the secret-key client, then read back.
 * Until the migration is applied (it runs when merged to `main`) the tables
 * don't exist: closes are then kept in this server's memory instead.
 * A provider failure never breaks the chart; that asset just has fewer days.
 */

const SYNC_EVERY_MS = 6 * 3600_000;
/** Days asked again on each sync, so late corrections from the provider land. */
const OVERLAP_DAYS = 5;
const DAY_MS = 86_400_000;
const PAGE = 1000; // PostgREST returns at most 1000 rows per request

interface SyncRow {
  firstDay: string;
  syncedAt: number;
}

interface Fetched {
  firstDay: string;
  closes: HistoryClose[];
  source: string;
}

/** Fallback while the tables don't exist (local testing before the merge). */
const memory = new Map<string, { sync: SyncRow; closes: HistoryClose[] }>();

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Closes of one asset from `startDay`, from the provider that has its history. */
async function fetchCloses(
  asset: PriceAsset,
  startDay: string,
  now: number,
): Promise<{ closes: HistoryClose[]; split: boolean; source: string } | null> {
  if (asset.assetClass === "crypto") {
    const pair = binanceSymbol(asset);
    if (!pair) return null;
    const closes = await retryTransient(() => binanceDailyCloses(fetch, pair, startDay, now));
    return { closes, split: false, source: "binance" };
  }
  const key = process.env.TIINGO_API_KEY;
  if (!key) return null;
  const result = await retryTransient(() => tiingoDailyCloses(fetch, key, asset.symbol, startDay));
  return { ...result, source: "tiingo" };
}

/**
 * Asks the provider for what is missing. A Tiingo split inside the new days
 * means the saved older closes are in old shares, so the whole history is
 * fetched again (decision 63). Returns null when nothing could be fetched.
 */
async function syncOne(
  asset: PriceAsset,
  fromDay: string,
  sync: SyncRow | undefined,
  now: number,
): Promise<Fetched | null> {
  const firstDay = sync && sync.firstDay < fromDay ? sync.firstDay : fromDay;
  const startDay = !sync || sync.firstDay > fromDay ? firstDay : isoDay(sync.syncedAt - OVERLAP_DAYS * DAY_MS);
  try {
    let result = await fetchCloses(asset, startDay, now);
    if (result?.split && startDay !== firstDay) result = await fetchCloses(asset, firstDay, now);
    if (!result) return null;
    return { firstDay, closes: result.closes, source: result.source };
  } catch (error) {
    console.warn(`[history] ${asset.symbol}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/** Every saved close of the assets from `fromDay`, page by page; null if the read fails. */
async function readCloses(assetIds: readonly string[], fromDay: string): Promise<Map<string, HistoryClose[]> | null> {
  const supabase = await createClient();
  const result = new Map<string, HistoryClose[]>(assetIds.map((id) => [id, []]));
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from("price_history")
      .select("asset_id, day, close::text")
      .in("asset_id", [...assetIds])
      .gte("day", fromDay)
      .order("asset_id")
      .order("day")
      .range(offset, offset + PAGE - 1);
    if (error) {
      console.warn(`[history] could not read closes: ${error.message}`);
      return null;
    }
    for (const row of data) result.get(row.asset_id)?.push({ day: row.day, close: row.close });
    if (data.length < PAGE) return result;
  }
}

/** Saves fetched closes and the sync state with the secret-key client. */
async function save(fetched: { asset: PriceAsset; result: Fetched }[], now: number) {
  const admin = getAdminClient();
  if (!admin || fetched.length === 0) return;
  const rows = fetched.flatMap(({ asset, result }) =>
    result.closes.map((c) => ({
      asset_id: asset.id,
      day: c.day,
      close: c.close,
      source: result.source,
    })),
  );
  for (let i = 0; i < rows.length; i += PAGE) {
    const { error } = await admin.from("price_history").upsert(rows.slice(i, i + PAGE), { onConflict: "asset_id,day" });
    if (error) {
      console.warn(`[history] could not save closes: ${error.message}`);
      return; // don't mark as synced, so the next view tries again
    }
  }
  const { error } = await admin.from("price_history_sync").upsert(
    fetched.map(({ asset, result }) => ({
      asset_id: asset.id,
      first_day: result.firstDay,
      synced_at: new Date(now).toISOString(),
    })),
    { onConflict: "asset_id" },
  );
  if (error) console.warn(`[history] could not save the sync state: ${error.message}`);
}

/**
 * Daily closes of each asset from `fromDay` (UTC "YYYY-MM-DD") to yesterday,
 * sorted by day. Assets without history (no provider, unknown ticker, no
 * TIINGO_API_KEY) come back with an empty list.
 */
export async function getDailyCloses(
  assets: readonly PriceAsset[],
  fromDay: string,
): Promise<Map<string, HistoryClose[]>> {
  if (assets.length === 0) return new Map();
  const now = Date.now();
  const ids = assets.map((a) => a.id);
  const supabase = await createClient();

  const { data: syncRows, error: syncError } = await supabase
    .from("price_history_sync")
    .select("asset_id, first_day, synced_at")
    .in("asset_id", ids);
  const useMemory = Boolean(syncError);
  if (syncError) console.warn(`[history] price_history tables missing, using memory: ${syncError.message}`);

  const syncs = new Map<string, SyncRow>();
  if (useMemory) {
    for (const id of ids) {
      const kept = memory.get(id);
      if (kept) syncs.set(id, kept.sync);
    }
  } else {
    for (const row of syncRows ?? []) {
      syncs.set(row.asset_id, {
        firstDay: row.first_day,
        syncedAt: Date.parse(row.synced_at),
      });
    }
  }

  const due = assets.filter((a) => {
    const sync = syncs.get(a.id);
    return !sync || sync.firstDay > fromDay || now - sync.syncedAt > SYNC_EVERY_MS;
  });
  // Three at a time: a burst would hit the free plans' limits.
  const results = await mapLimited(due, 3, async (asset) => ({
    asset,
    result: await syncOne(asset, fromDay, syncs.get(asset.id), now),
  }));
  const fetched = results.filter((r): r is { asset: PriceAsset; result: Fetched } => r.result !== null);

  if (useMemory) {
    for (const { asset, result } of fetched) {
      const old = memory.get(asset.id)?.closes ?? [];
      const byDay = new Map([...old, ...result.closes].map((c) => [c.day, c]));
      const closes = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
      memory.set(asset.id, {
        sync: { firstDay: result.firstDay, syncedAt: now },
        closes,
      });
    }
    return new Map(ids.map((id) => [id, (memory.get(id)?.closes ?? []).filter((c) => c.day >= fromDay)]));
  }

  await save(fetched, now);
  const closes = await readCloses(ids, fromDay);
  if (closes) return closes;
  // Reading failed: fall back to what was just fetched.
  const fresh = new Map(fetched.map(({ asset, result }) => [asset.id, result.closes.filter((c) => c.day >= fromDay)]));
  return new Map(ids.map((id) => [id, fresh.get(id) ?? []]));
}
