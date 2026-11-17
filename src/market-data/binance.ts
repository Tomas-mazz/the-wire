import { getJson, mapLimited, ProviderHttpError } from "./http";
import type { FetchLike, PriceAsset, PriceProvider, Quote } from "./types";

/*
 * Binance spot market data (public, no API key).
 * Docs: developers.binance.com/docs/binance-spot-api-docs
 *  - REST: GET /api/v3/ticker/24hr?symbols=["BTCUSDT",...] on the market-data-only
 *    host data-api.binance.vision. Weight 2 for 1–20 symbols, 40 for 21–100
 *    (limit: 6000 per minute per IP). Max 100 symbols per request.
 *  - WebSocket (used in the browser): wss://data-stream.binance.vision/stream?streams=btcusdt@miniTicker/...
 * Binance refuses some regions (HTTP 451), so callers fall back to CoinGecko.
 */

export const BINANCE_REST = "https://data-api.binance.vision";
export const BINANCE_STREAM = "wss://data-stream.binance.vision";

/** Max symbols per 24hr ticker request (Binance docs). */
const BATCH = 100;

/**
 * Binance pair for an asset: an explicit `provider_refs.binance`, otherwise
 * the symbol against USDT (BTC → BTCUSDT). USDT is a dollar stablecoin, so
 * its price stands in for USD. Only crypto has a Binance pair.
 */
export function binanceSymbol(asset: Pick<PriceAsset, "symbol" | "assetClass" | "providerRefs">): string | null {
  if (asset.assetClass !== "crypto") return null;
  const ref = asset.providerRefs.binance;
  if (ref) return ref.toUpperCase();
  if (asset.symbol === "USDT") return null; // USDT against itself has no pair
  return `${asset.symbol}USDT`;
}

/** Stream name for the 1-second mini ticker (stream symbols are lowercase). */
export function miniTickerStream(pair: string): string {
  return `${pair.toLowerCase()}@miniTicker`;
}

interface Ticker24h {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
}

function isTicker(value: unknown): value is Ticker24h {
  const v = value as Ticker24h;
  return (
    typeof v === "object" &&
    v !== null &&
    typeof v.symbol === "string" &&
    typeof v.lastPrice === "string" &&
    typeof v.priceChangePercent === "string"
  );
}

/** Turns a 24hr ticker response (one object or an array) into quotes. */
export function parseBinanceTickers(body: unknown, assetsByPair: Map<string, PriceAsset[]>): Quote[] {
  const list = Array.isArray(body) ? body : [body];
  const quotes: Quote[] = [];
  for (const item of list) {
    if (!isTicker(item) || !/^\d+(\.\d+)?$/.test(item.lastPrice)) continue;
    // A pair with no trades in 24h reports 0; that is not a real price.
    if (Number(item.lastPrice) === 0) continue;
    for (const asset of assetsByPair.get(item.symbol) ?? []) {
      quotes.push({
        assetId: asset.id,
        price: item.lastPrice,
        dayChangePct: /^-?\d+(\.\d+)?$/.test(item.priceChangePercent) ? item.priceChangePercent : null,
        source: "binance",
      });
    }
  }
  return quotes;
}

/** Binance answers HTTP 400 with code -1121 when any symbol of the batch is unknown. */
function isInvalidSymbol(error: unknown): boolean {
  return error instanceof ProviderHttpError && error.status === 400 && error.body.includes("-1121");
}

export function createBinanceProvider(fetchImpl: FetchLike = fetch): PriceProvider {
  const fetchTickers = (pairs: string[]) =>
    getJson(
      fetchImpl,
      "binance",
      `${BINANCE_REST}/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(pairs))}`,
    );

  return {
    id: "binance",
    async getQuotes(assets) {
      const assetsByPair = new Map<string, PriceAsset[]>();
      for (const asset of assets) {
        const pair = binanceSymbol(asset);
        if (!pair) continue;
        assetsByPair.set(pair, [...(assetsByPair.get(pair) ?? []), asset]);
      }
      const pairs = [...assetsByPair.keys()];
      const quotes: Quote[] = [];

      for (let i = 0; i < pairs.length; i += BATCH) {
        const batch = pairs.slice(i, i + BATCH);
        try {
          quotes.push(...parseBinanceTickers(await fetchTickers(batch), assetsByPair));
        } catch (error) {
          if (!isInvalidSymbol(error)) throw error;
          // One unknown pair fails the whole batch: ask one by one (weight 2
          // each) and skip the unknown ones, which CoinGecko can still price.
          const single = await mapLimited(batch, 4, async (pair) => {
            try {
              return parseBinanceTickers(await fetchTickers([pair]), assetsByPair);
            } catch (inner) {
              if (isInvalidSymbol(inner)) return [];
              throw inner;
            }
          });
          quotes.push(...single.flat());
        }
      }
      return quotes;
    },
  };
}
