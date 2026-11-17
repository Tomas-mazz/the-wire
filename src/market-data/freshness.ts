import type { PriceAssetClass } from "./types";

/**
 * When a cached price is refreshed and when it is shown as out of date.
 *  - Refresh: crypto after 20 s, stocks after 30 s (Finnhub allows 60 calls a
 *    minute, one per symbol). The page polls every 30 s (decision 90).
 *  - Stale: a price whose last successful update is over 10 minutes old,
 *    which means the providers have been failing. Stocks outside market
 *    hours keep refreshing (to the closing price), so they are not stale.
 */
export const REFRESH_AFTER_MS: Record<PriceAssetClass, number> = {
  crypto: 20_000,
  stock: 30_000,
  etf: 30_000,
};

export const STALE_AFTER_MS = 10 * 60_000;

export const POLL_INTERVAL_MS = 30_000;

export function needsRefresh(assetClass: PriceAssetClass, asOf: string | null, now: number): boolean {
  if (!asOf) return true;
  const age = now - Date.parse(asOf);
  return !Number.isFinite(age) || age >= REFRESH_AFTER_MS[assetClass];
}

export function isStale(asOf: string, now: number): boolean {
  const age = now - Date.parse(asOf);
  return !Number.isFinite(age) || age >= STALE_AFTER_MS;
}
