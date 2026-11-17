import { binanceSymbol, createBinanceProvider } from "./binance";
import { createCoinGeckoProvider } from "./coingecko";
import { createFinnhubProvider } from "./finnhub";
import type { FetchLike, PriceAsset, PriceProvider, ProviderId, Quote } from "./types";

export * from "./types";
export * from "./freshness";
export { binanceSymbol, miniTickerStream, BINANCE_STREAM } from "./binance";

export interface MarketDataConfig {
  coingeckoApiKey?: string;
  finnhubApiKey?: string;
  fetch?: FetchLike;
}

export interface QuoteResult {
  quotes: Quote[];
  /** Providers that failed this time (for logs); their assets are just missing. */
  failures: { provider: ProviderId; message: string }[];
}

/** The providers in the order they are asked (decision 89). */
export function createProviders(config: MarketDataConfig): {
  crypto: PriceProvider[];
  stocks: PriceProvider[];
} {
  const fetchImpl = config.fetch ?? fetch;
  return {
    crypto: [createBinanceProvider(fetchImpl), createCoinGeckoProvider(config.coingeckoApiKey, fetchImpl)],
    stocks: config.finnhubApiKey ? [createFinnhubProvider(config.finnhubApiKey, fetchImpl)] : [],
  };
}

/**
 * Asks each provider in turn for the assets still without a price: crypto
 * goes to Binance, then CoinGecko; stocks and ETFs go to Finnhub. A failing
 * provider never breaks the others; its assets stay without a price.
 */
export async function fetchQuotes(
  assets: readonly PriceAsset[],
  providers: { crypto: PriceProvider[]; stocks: PriceProvider[] },
): Promise<QuoteResult> {
  const quotes: Quote[] = [];
  const failures: QuoteResult["failures"] = [];

  async function runChain(chain: PriceProvider[], wanted: readonly PriceAsset[]) {
    let pending = [...wanted];
    for (const provider of chain) {
      if (pending.length === 0) return;
      try {
        const found = await provider.getQuotes(pending);
        const priced = new Set(found.map((q) => q.assetId));
        quotes.push(...found);
        pending = pending.filter((a) => !priced.has(a.id));
      } catch (error) {
        failures.push({ provider: provider.id, message: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  await Promise.all([
    runChain(providers.crypto, assets.filter((a) => a.assetClass === "crypto")),
    runChain(providers.stocks, assets.filter((a) => a.assetClass !== "crypto")),
  ]);
  return { quotes, failures };
}

/** Pairs the browser can follow live on Binance, keyed by asset id. */
export function livePairs(assets: readonly PriceAsset[]): Record<string, string> {
  const pairs: Record<string, string> = {};
  for (const asset of assets) {
    const pair = binanceSymbol(asset);
    if (pair) pairs[asset.id] = pair;
  }
  return pairs;
}
