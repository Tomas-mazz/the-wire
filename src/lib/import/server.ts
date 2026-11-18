import "server-only";
import type { Transaction } from "@/domain";
import { findAssetsByIsin, findAssetsBySymbol, findOrCreateAsset } from "@/lib/portfolio/assets";
import type { createClient } from "@/lib/supabase/server";
import { fetchUsdRates } from "@/market-data/fx";
import { mapLimited } from "@/market-data/http";
import { searchCoins, searchStocks, type SearchConfig } from "@/market-data/search";
import { assetKey, buildReview, identity, rateKey, type ResolvedAsset, type ReviewRow } from "./review";
import type { ImportBroker, ImportedAsset, ImportedTransaction } from "./types";

/*
 * Server side of the import: gathers what the pure review needs (exchange
 * rates, assets, earlier imports, the project's ledger) and saves the rows the
 * user confirmed. Nothing is stored between the preview and the save: the
 * file is read again and the review rebuilt, so the save never trusts the browser.
 */

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Limits that keep one upload from flooding the free APIs. */
export const MAX_IMPORT_ROWS = 3000;
const MAX_RATE_DAYS = 400;
const MAX_LOOKUPS = 60;

const BROKER_LABEL: Record<ImportBroker, string | null> = {
  nordnet: "Nordnet",
  binance: "Binance",
  coinbase: "Coinbase",
  thewire: null,
};

function searchConfig(): SearchConfig {
  return { finnhubApiKey: process.env.FINNHUB_API_KEY, coingeckoApiKey: process.env.COINGECKO_API_KEY };
}

/** rateKey(day, currency) → units per USD, or null when the ECB had nothing or the call failed. */
async function loadRates(transactions: readonly ImportedTransaction[]): Promise<Map<string, string | null>> {
  const byDay = new Map<string, Set<string>>();
  for (const tx of transactions) {
    if (tx.currency === "USD") continue;
    const day = tx.executedAt.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? new Set()).add(tx.currency));
  }
  const rates = new Map<string, string | null>();
  const days = [...byDay.keys()];
  await mapLimited(days.slice(0, MAX_RATE_DAYS), 4, async (day) => {
    const currencies = [...byDay.get(day)!];
    try {
      const answer = await fetchUsdRates(day, currencies);
      for (const c of currencies) rates.set(rateKey(day, c), answer.rates[c] ?? null);
    } catch (error) {
      console.error("Exchange rate lookup failed:", (error as Error).message);
      for (const c of currencies) rates.set(rateKey(day, c), null);
    }
  });
  return rates;
}

/** assetKey → the asset it is, from our catalogue first and the price providers second. */
async function resolveAssets(supabase: Supabase, assets: readonly ImportedAsset[]): Promise<Map<string, ResolvedAsset | null>> {
  const unique = new Map<string, ImportedAsset>();
  for (const asset of assets) unique.set(assetKey(asset), asset);

  const isins = [...unique.values()].flatMap((a) => (a.isin ? [a.isin] : []));
  const symbols = [...unique.values()].flatMap((a) => (!a.isin && a.symbol ? [a.symbol] : []));
  const [byIsin, bySymbol] = await Promise.all([findAssetsByIsin(supabase, isins), findAssetsBySymbol(supabase, symbols)]);

  const resolved = new Map<string, ResolvedAsset | null>();
  const toLookUp: [string, ImportedAsset][] = [];
  for (const [key, asset] of unique) {
    const known = asset.isin
      ? byIsin.get(asset.isin)
      : bySymbol.find(
          (a) => a.symbol === asset.symbol && (asset.kind === "crypto" ? a.assetClass === "crypto" : a.assetClass !== "crypto"),
        );
    if (known) {
      resolved.set(key, { symbol: known.symbol, name: known.name, assetClass: known.assetClass, providerRefs: known.providerRefs });
    } else {
      toLookUp.push([key, asset]);
    }
  }

  const config = searchConfig();
  await mapLimited(toLookUp.slice(0, MAX_LOOKUPS), 3, async ([key, asset]) => {
    try {
      if (asset.isin) {
        const [match] = await searchStocks(asset.isin, config);
        resolved.set(key, match ? { ...match, providerRefs: { ...match.providerRefs, isin: asset.isin } } : null);
      } else if (asset.kind === "crypto") {
        const match = (await searchCoins(asset.symbol!, config)).find((c) => c.symbol === asset.symbol);
        resolved.set(key, match ?? null);
      } else {
        const match = (await searchStocks(asset.symbol!, config)).find((c) => c.symbol === asset.symbol);
        resolved.set(key, match ?? null);
      }
    } catch (error) {
      console.error("Asset lookup failed:", (error as Error).message);
      resolved.set(key, null);
    }
  });
  return resolved;
}

async function loadExistingKeys(supabase: Supabase, keys: readonly string[]): Promise<Set<string>> {
  const existing = new Set<string>();
  for (let i = 0; i < keys.length; i += 200) {
    const { data, error } = await supabase
      .from("transactions")
      .select("external_id")
      .in("external_id", keys.slice(i, i + 200));
    if (error) throw new Error(`Could not check earlier imports: ${error.message}`);
    for (const row of data) existing.add(row.external_id);
  }
  return existing;
}

/** identity(asset) → that asset's ledger in the project. */
async function loadLedgers(
  supabase: Supabase,
  projectId: string,
  assets: readonly ResolvedAsset[],
): Promise<Map<string, Transaction[]>> {
  const ledgers = new Map<string, Transaction[]>();
  const wanted = new Set(assets.map(identity));
  const catalogue = (await findAssetsBySymbol(supabase, assets.map((a) => a.symbol))).filter((a) => wanted.has(identity(a)));
  if (catalogue.length === 0) return ledgers;

  const idToIdentity = new Map(catalogue.map((a) => [a.id, identity(a)]));
  const { data, error } = await supabase
    .from("transactions")
    .select("id, asset_id, type, quantity::text, unit_price::text, fee::text, executed_at, created_at")
    .eq("project_id", projectId)
    .in("asset_id", [...idToIdentity.keys()]);
  if (error) throw new Error(`Could not load the ledger: ${error.message}`);
  for (const r of data) {
    const id = idToIdentity.get(r.asset_id)!;
    ledgers.set(id, [
      ...(ledgers.get(id) ?? []),
      {
        id: r.id,
        type: r.type,
        quantity: r.quantity,
        unitPrice: r.unit_price,
        fee: r.fee,
        executedAt: r.executed_at,
        createdAt: r.created_at,
      },
    ]);
  }
  return ledgers;
}

/** The review table for these rows, judged against what the project already has. */
export async function reviewImport(
  supabase: Supabase,
  transactions: readonly ImportedTransaction[],
  projectId: string,
): Promise<ReviewRow[]> {
  const [rates, assets] = await Promise.all([
    loadRates(transactions),
    resolveAssets(
      supabase,
      transactions.map((t) => t.asset),
    ),
  ]);
  const existingKeys = await loadExistingKeys(
    supabase,
    transactions.map((t) => `${t.broker}:${t.externalId}`),
  );
  const resolved = [...assets.values()].filter((a): a is ResolvedAsset => a !== null);
  const ledgers = await loadLedgers(supabase, projectId, resolved);
  return buildReview({ transactions, rates, assets, existingKeys, ledgers });
}

/** Saves the "new" rows. Rows imported in the meantime are skipped by the unique index. */
export async function saveImport(
  supabase: Supabase,
  rows: readonly ReviewRow[],
  projectId: string,
  broker: ImportBroker,
): Promise<{ saved: number; failed: boolean }> {
  const ready = rows.filter((r) => r.status === "new" && r.asset !== null && r.unitPrice !== null);
  const assetIds = new Map<string, string | null>();
  for (const row of ready) {
    const id = identity(row.asset!);
    if (assetIds.has(id)) continue;
    assetIds.set(
      id,
      await findOrCreateAsset(supabase, {
        symbol: row.asset!.symbol,
        name: row.asset!.name,
        asset_class: row.asset!.assetClass,
        provider_refs: row.asset!.providerRefs,
      }),
    );
  }

  // created_at grows by 1 ms per row, so rows with the same time replay in file order.
  const base = Date.now();
  const payload = ready
    .filter((row) => assetIds.get(identity(row.asset!)))
    .map((row, i) => ({
      project_id: projectId,
      asset_id: assetIds.get(identity(row.asset!))!,
      type: row.type,
      quantity: row.quantity,
      unit_price: row.unitPrice!,
      fee: row.fee,
      currency: "USD",
      executed_at: row.executedAt,
      broker: row.brokerName ?? BROKER_LABEL[broker],
      note: row.note ?? null,
      source: "csv",
      external_id: row.key,
      created_at: new Date(base + i).toISOString(),
    }));

  let saved = 0;
  for (let i = 0; i < payload.length; i += 500) {
    const { data, error } = await supabase
      .from("transactions")
      .upsert(payload.slice(i, i + 500), { onConflict: "user_id,external_id", ignoreDuplicates: true })
      .select("id");
    if (error) {
      console.error("saveImport failed:", error.message);
      return { saved, failed: true };
    }
    saved += data.length;
  }
  return { saved, failed: payload.length < ready.length };
}
