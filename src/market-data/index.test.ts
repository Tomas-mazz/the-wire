import { describe, expect, it } from "vitest";
import { fetchQuotes, isStale, livePairs, needsRefresh } from "./index";
import { asset } from "./test-helpers";
import type { PriceAsset, PriceProvider, ProviderId } from "./types";

function provider(id: ProviderId, prices: Record<string, string> | Error): PriceProvider & { asked: string[][] } {
  const asked: string[][] = [];
  return {
    id,
    asked,
    async getQuotes(assets: readonly PriceAsset[]) {
      asked.push(assets.map((a) => a.symbol));
      if (prices instanceof Error) throw prices;
      return assets
        .filter((a) => prices[a.symbol])
        .map((a) => ({ assetId: a.id, price: prices[a.symbol], dayChangePct: null, source: id }));
    },
  };
}

describe("fetchQuotes", () => {
  it("sends crypto to Binance first and only the leftovers to CoinGecko", async () => {
    const binance = provider("binance", { BTC: "1" });
    const coingecko = provider("coingecko", { RARE: "2" });
    const finnhub = provider("finnhub", { AAPL: "3" });
    const result = await fetchQuotes([asset("BTC"), asset("RARE"), asset("AAPL", "stock")], {
      crypto: [binance, coingecko],
      stocks: [finnhub],
    });
    expect(coingecko.asked).toEqual([["RARE"]]);
    expect(finnhub.asked).toEqual([["AAPL"]]);
    expect(result.quotes.map((q) => [q.assetId, q.source]).sort()).toEqual([
      ["id-AAPL", "finnhub"],
      ["id-BTC", "binance"],
      ["id-RARE", "coingecko"],
    ]);
    expect(result.failures).toEqual([]);
  });

  it("falls back to CoinGecko for everything when Binance fails, and reports the failure", async () => {
    const binance = provider("binance", new Error("HTTP 451"));
    const coingecko = provider("coingecko", { BTC: "1" });
    const result = await fetchQuotes([asset("BTC")], { crypto: [binance, coingecko], stocks: [] });
    expect(result.quotes).toHaveLength(1);
    expect(result.failures).toEqual([{ provider: "binance", message: "HTTP 451" }]);
  });

  it("leaves stocks without a price when there is no stock provider (no Finnhub key)", async () => {
    const result = await fetchQuotes([asset("AAPL", "stock")], { crypto: [], stocks: [] });
    expect(result.quotes).toEqual([]);
  });
});

describe("freshness", () => {
  const now = Date.parse("2026-11-17T12:00:00Z");
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it("refreshes crypto after 20 s and stocks after 30 s, or when there is no price", () => {
    expect(needsRefresh("crypto", ago(19_000), now)).toBe(false);
    expect(needsRefresh("crypto", ago(20_000), now)).toBe(true);
    expect(needsRefresh("stock", ago(25_000), now)).toBe(false);
    expect(needsRefresh("etf", ago(30_000), now)).toBe(true);
    expect(needsRefresh("stock", null, now)).toBe(true);
  });

  it("calls a price stale after 10 minutes without a successful update", () => {
    expect(isStale(ago(9 * 60_000), now)).toBe(false);
    expect(isStale(ago(10 * 60_000), now)).toBe(true);
    expect(isStale("not a date", now)).toBe(true);
  });
});

describe("livePairs", () => {
  it("maps crypto assets to their Binance pair", () => {
    expect(livePairs([asset("BTC"), asset("AAPL", "stock")])).toEqual({ "id-BTC": "BTCUSDT" });
  });
});
