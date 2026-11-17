import { getJson, numberToDecimalText, signedNumberToDecimalText } from "./http";
import type { FetchLike, PriceAsset, PriceProvider, Quote } from "./types";

/*
 * CoinGecko, the crypto fallback when Binance is unreachable or lacks a coin.
 * Docs: docs.coingecko.com/reference/simple-price
 *  - GET https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&symbols=btc,eth
 *    &include_24hr_change=true. With `ids=bitcoin,...` instead, results are keyed by id.
 *  - Free "Demo" key in the x-cg-demo-api-key header: 100 calls/min, 10,000/month.
 *    Without a key the public API still answers, with lower limits.
 *  - The Demo plan asks for attribution ("Data provided by CoinGecko").
 * Symbols can be shared by several coins; CoinGecko then picks the largest
 * one. An exact coin can be pinned with `provider_refs.coingecko`.
 */

export const COINGECKO_API = "https://api.coingecko.com/api/v3";

interface SimplePrice {
  usd?: unknown;
  usd_24h_change?: unknown;
}

/** Turns a /simple/price response into quotes; `keyOf` says which key each asset has. */
export function parseCoinGeckoPrices(
  body: unknown,
  assets: readonly PriceAsset[],
  keyOf: (asset: PriceAsset) => string,
): Quote[] {
  if (typeof body !== "object" || body === null) return [];
  const table = body as Record<string, SimplePrice | undefined>;
  const quotes: Quote[] = [];
  for (const asset of assets) {
    const entry = table[keyOf(asset)];
    const price = numberToDecimalText(entry?.usd);
    if (!entry || price === null || price === "0") continue;
    quotes.push({
      assetId: asset.id,
      price,
      dayChangePct: signedNumberToDecimalText(entry.usd_24h_change),
      source: "coingecko",
    });
  }
  return quotes;
}

export function createCoinGeckoProvider(apiKey?: string, fetchImpl: FetchLike = fetch): PriceProvider {
  const headers: Record<string, string> = apiKey ? { "x-cg-demo-api-key": apiKey } : {};
  const request = (param: "ids" | "symbols", keys: string[]) =>
    getJson(
      fetchImpl,
      "coingecko",
      `${COINGECKO_API}/simple/price?vs_currencies=usd&include_24hr_change=true&${param}=${encodeURIComponent(keys.join(","))}`,
      headers,
    );

  return {
    id: "coingecko",
    async getQuotes(assets) {
      const crypto = assets.filter((a) => a.assetClass === "crypto");
      const byId = crypto.filter((a) => a.providerRefs.coingecko);
      const bySymbol = crypto.filter((a) => !a.providerRefs.coingecko);
      const idKey = (a: PriceAsset) => a.providerRefs.coingecko;
      const symbolKey = (a: PriceAsset) => a.symbol.toLowerCase();

      const quotes: Quote[] = [];
      if (byId.length > 0) {
        quotes.push(...parseCoinGeckoPrices(await request("ids", [...new Set(byId.map(idKey))]), byId, idKey));
      }
      if (bySymbol.length > 0) {
        const keys = [...new Set(bySymbol.map(symbolKey))];
        quotes.push(...parseCoinGeckoPrices(await request("symbols", keys), bySymbol, symbolKey));
      }
      return quotes;
    },
  };
}
