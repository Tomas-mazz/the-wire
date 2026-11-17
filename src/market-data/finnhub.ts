import { getJson, mapLimited, numberToDecimalText, signedNumberToDecimalText } from "./http";
import type { FetchLike, PriceAsset, PriceProvider, Quote } from "./types";

/*
 * Finnhub, for US stocks and ETFs (free plan: US only, personal use).
 * Spec: finnhub.io/static/swagger.json
 *  - GET https://finnhub.io/api/v1/quote?symbol=AAPL&token=KEY
 *    → { c: current, d: change, dp: percent change, h, l, o, pc: previous close, t }
 *  - Free plan: 60 calls per minute. One call per symbol, so the server
 *    caches prices and asks again at most every 30 s per asset.
 * An unknown symbol answers with c = 0, which is treated as "no price".
 */

export const FINNHUB_API = "https://finnhub.io/api/v1";

export function parseFinnhubQuote(body: unknown, asset: PriceAsset): Quote | null {
  if (typeof body !== "object" || body === null) return null;
  const { c, dp } = body as { c?: unknown; dp?: unknown };
  const price = numberToDecimalText(c);
  if (price === null || price === "0") return null;
  return { assetId: asset.id, price, dayChangePct: signedNumberToDecimalText(dp), source: "finnhub" };
}

/** Finnhub symbol: an explicit `provider_refs.finnhub`, otherwise the asset symbol. */
export function finnhubSymbol(asset: PriceAsset): string {
  return asset.providerRefs.finnhub ?? asset.symbol;
}

export function createFinnhubProvider(apiKey: string, fetchImpl: FetchLike = fetch): PriceProvider {
  return {
    id: "finnhub",
    async getQuotes(assets) {
      const stocks = assets.filter((a) => a.assetClass === "stock" || a.assetClass === "etf");
      // The spec documents the key only as the `token` query parameter. These
      // URLs are built on the server and never logged or sent to the browser.
      const results = await mapLimited(stocks, 5, async (asset) =>
        parseFinnhubQuote(
          await getJson(
            fetchImpl,
            "finnhub",
            `${FINNHUB_API}/quote?symbol=${encodeURIComponent(finnhubSymbol(asset))}&token=${encodeURIComponent(apiKey)}`,
          ),
          asset,
        ),
      );
      return results.filter((q): q is Quote => q !== null);
    },
  };
}
