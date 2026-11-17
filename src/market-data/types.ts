/**
 * Shared types for price providers. This layer only knows about prices:
 * no React, no database, no portfolio math (AGENTS.md: keep layers apart).
 */

export type PriceAssetClass = "stock" | "etf" | "crypto";

/** What a provider needs to know about an asset to price it. */
export interface PriceAsset {
  id: string;
  symbol: string;
  assetClass: PriceAssetClass;
  /** Optional provider ids from `assets.provider_refs`, e.g. { binance: "BTCUSDT", coingecko: "bitcoin" }. */
  providerRefs: Record<string, string>;
}

export type ProviderId = "binance" | "coingecko" | "finnhub";

/** One price, as exact decimal text (never a float). */
export interface Quote {
  assetId: string;
  /** Last price in USD. */
  price: string;
  /** Change over the provider's day window, in percent (2.5 = +2.5 %), or null. */
  dayChangePct: string | null;
  source: ProviderId;
}

export interface PriceProvider {
  id: ProviderId;
  /**
   * Prices for the given assets. Assets the provider does not know are
   * simply left out of the result; a network or API failure throws.
   */
  getQuotes(assets: readonly PriceAsset[]): Promise<Quote[]>;
}

/** fetch, injectable so tests never touch the network. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
