import "server-only";
import {
  createProviders,
  fetchQuotes,
  needsRefresh,
  type PriceAsset,
  type PriceAssetClass,
} from "@/market-data";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { withManualPrices } from "./merge";
import type { PriceSnapshot } from "./types";

export type { PriceSnapshot };

const PRICED_CLASSES: readonly string[] = ["stock", "etf", "crypto"];

/* eslint-disable @typescript-eslint/no-explicit-any -- rows from the untyped Supabase client */
function toPriceAsset(row: any): PriceAsset {
  const refs: Record<string, string> = {};
  for (const [key, value] of Object.entries(row.provider_refs ?? {})) {
    if (typeof value === "string") refs[key] = value;
  }
  return { id: row.id, symbol: row.symbol, assetClass: row.asset_class as PriceAssetClass, providerRefs: refs };
}

function toSnapshot(row: any): PriceSnapshot {
  return {
    assetId: row.asset_id,
    price: row.price,
    dayChangePct: row.day_change_pct,
    asOf: row.as_of,
    source: row.source,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** The given assets as providers need them (cash and unknown ids are left out). */
export async function getPriceAssets(assetIds: readonly string[]): Promise<PriceAsset[]> {
  if (assetIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("id, symbol, asset_class, provider_refs")
    .in("id", [...new Set(assetIds)]);
  if (error) throw new Error(`Could not load assets for prices: ${error.message}`);
  return data.filter((row) => PRICED_CLASSES.includes(row.asset_class)).map(toPriceAsset);
}

/**
 * Latest prices for the assets (decision 89):
 *  1. read the shared cache (`latest_prices`);
 *  2. ask the providers again only for prices that are missing or older
 *     than the refresh time (20 s crypto, 30 s stocks);
 *  3. save fresh prices with the secret-key client, so every user and every
 *     open tab shares one provider call.
 * If the providers fail, the cached price is returned with its old `asOf`,
 * and the UI marks it as out of date. Never throws because of a provider.
 */
export async function getPrices(assets: readonly PriceAsset[]): Promise<PriceSnapshot[]> {
  if (assets.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("latest_prices")
    .select("asset_id, price::text, day_change_pct::text, as_of, source")
    .in(
      "asset_id",
      assets.map((a) => a.id),
    );
  if (error) throw new Error(`Could not load cached prices: ${error.message}`);

  const prices = new Map(data.map((row) => [row.asset_id as string, toSnapshot(row)]));
  const now = Date.now();
  const due = assets.filter((a) => needsRefresh(a.assetClass, prices.get(a.id)?.asOf ?? null, now));
  if (due.length === 0) return [...prices.values()];

  const { quotes, failures } = await fetchQuotes(
    due,
    createProviders({
      coingeckoApiKey: process.env.COINGECKO_API_KEY,
      finnhubApiKey: process.env.FINNHUB_API_KEY,
    }),
  );
  for (const failure of failures) {
    console.warn(`[prices] ${failure.provider} failed: ${failure.message}`);
  }

  const asOf = new Date(now).toISOString();
  const fresh: PriceSnapshot[] = quotes.map((q) => ({ ...q, asOf }));
  for (const snapshot of fresh) prices.set(snapshot.assetId, snapshot);

  if (fresh.length > 0) {
    const admin = getAdminClient();
    if (admin) {
      const { error: saveError } = await admin.from("latest_prices").upsert(
        fresh.map((p) => ({
          asset_id: p.assetId,
          price: p.price,
          day_change_pct: p.dayChangePct,
          as_of: p.asOf,
          source: p.source,
        })),
        { onConflict: "asset_id" },
      );
      if (saveError) console.warn(`[prices] could not save the cache: ${saveError.message}`);
    }
  }
  return [...prices.values()];
}

/**
 * The signed-in user's manual prices for these assets. Row Level Security
 * returns only the user's own rows, so no user id is needed here.
 */
export async function getManualPrices(assetIds: readonly string[]): Promise<PriceSnapshot[]> {
  if (assetIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("manual_prices")
    .select("asset_id, price::text, as_of")
    .in("asset_id", [...new Set(assetIds)]);
  if (error) throw new Error(`Could not load manual prices: ${error.message}`);
  return data.map((row) => ({
    assetId: row.asset_id as string,
    price: row.price as string,
    dayChangePct: null,
    asOf: row.as_of as string,
    source: "manual" as const,
  }));
}

/** Provider prices, with the user's manual prices filling the gaps (decision 91). */
export async function getPricesForUser(assets: readonly PriceAsset[]): Promise<PriceSnapshot[]> {
  const [provider, manual] = await Promise.all([
    getPrices(assets),
    getManualPrices(assets.map((a) => a.id)),
  ]);
  return withManualPrices(provider, manual);
}
