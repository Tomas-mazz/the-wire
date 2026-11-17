import { COINGECKO_API } from "./coingecko";
import { FINNHUB_API } from "./finnhub";
import { getJson } from "./http";
import type { FetchLike, PriceAssetClass, ProviderId } from "./types";

/*
 * Asset search across providers (decision 81), for the transaction form.
 *  - Stocks/ETFs: Finnhub GET /search?q=apple&exchange=US
 *    → { count, result: [{ description, displaySymbol, symbol, type }] },
 *    type "Common Stock" (also "ADR", "REIT") or "ETP" for ETFs.
 *  - Crypto: CoinGecko GET /search?query=sol
 *    → { coins: [{ id, name, symbol, market_cap_rank }], ... }
 * The provider id is kept in `providerRefs`, so the price lookup later asks
 * for exactly that coin or ticker.
 */

export interface AssetCandidate {
  symbol: string;
  name: string;
  assetClass: PriceAssetClass;
  providerRefs: Partial<Record<ProviderId, string>>;
}

/** Results per kind, so stocks never crowd out crypto. */
export const SEARCH_LIMIT = 6;

const SYMBOL = /^[A-Z0-9.\-]{1,20}$/;

const FINNHUB_TYPES: Record<string, PriceAssetClass> = {
  "Common Stock": "stock",
  ADR: "stock",
  REIT: "stock",
  ETP: "etf",
};

export function parseFinnhubSearch(body: unknown): AssetCandidate[] {
  const result = (body as { result?: unknown })?.result;
  if (!Array.isArray(result)) return [];
  const found: AssetCandidate[] = [];
  for (const item of result) {
    const { symbol, description, type } = (item ?? {}) as Record<string, unknown>;
    if (typeof symbol !== "string" || typeof description !== "string" || typeof type !== "string") continue;
    const assetClass = FINNHUB_TYPES[type];
    if (!assetClass || !SYMBOL.test(symbol) || description.trim() === "") continue;
    found.push({ symbol, name: description.trim().slice(0, 120), assetClass, providerRefs: { finnhub: symbol } });
    if (found.length === SEARCH_LIMIT) break;
  }
  return found;
}

export function parseCoinGeckoSearch(body: unknown): AssetCandidate[] {
  const coins = (body as { coins?: unknown })?.coins;
  if (!Array.isArray(coins)) return [];
  const found: AssetCandidate[] = [];
  for (const coin of coins) {
    const { id, name, symbol } = (coin ?? {}) as Record<string, unknown>;
    if (typeof id !== "string" || typeof name !== "string" || typeof symbol !== "string") continue;
    const upper = symbol.toUpperCase();
    if (!SYMBOL.test(upper) || name.trim() === "") continue;
    found.push({ symbol: upper, name: name.trim().slice(0, 120), assetClass: "crypto", providerRefs: { coingecko: id } });
    if (found.length === SEARCH_LIMIT) break;
  }
  return found;
}

export interface SearchConfig {
  coingeckoApiKey?: string;
  finnhubApiKey?: string;
  fetch?: FetchLike;
}

/** Searches both providers at once; one failing never hides the other's results. */
export async function searchAssets(query: string, config: SearchConfig): Promise<AssetCandidate[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const fetchImpl = config.fetch ?? fetch;

  const stocks = config.finnhubApiKey
    ? getJson(
        fetchImpl,
        "finnhub",
        `${FINNHUB_API}/search?q=${encodeURIComponent(q)}&exchange=US&token=${encodeURIComponent(config.finnhubApiKey)}`,
      ).then(parseFinnhubSearch)
    : Promise.resolve([]);
  const crypto = getJson(
    fetchImpl,
    "coingecko",
    `${COINGECKO_API}/search?query=${encodeURIComponent(q)}`,
    config.coingeckoApiKey ? { "x-cg-demo-api-key": config.coingeckoApiKey } : {},
  ).then(parseCoinGeckoSearch);

  const [s, c] = await Promise.allSettled([stocks, crypto]);
  return [...(c.status === "fulfilled" ? c.value : []), ...(s.status === "fulfilled" ? s.value : [])];
}
