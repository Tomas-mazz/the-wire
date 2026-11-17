import { describe, expect, it } from "vitest";
import { parseCoinGeckoSearch, parseFinnhubSearch, searchAssets } from "./search";
import { fakeFetch } from "./test-helpers";

const finnhubBody = {
  count: 4,
  result: [
    { description: "Apple Inc.", displaySymbol: "AAPL", symbol: "AAPL", type: "Common Stock" },
    { description: "VANGUARD S&P 500 ETF", displaySymbol: "VOO", symbol: "VOO", type: "ETP" },
    { description: "Some Warrant", displaySymbol: "XYZ.WS", symbol: "XYZ.WS", type: "Warrant" },
    { description: "", displaySymbol: "EMPTY", symbol: "EMPTY", type: "Common Stock" },
  ],
};

const coingeckoBody = {
  coins: [
    { id: "solana", name: "Solana", api_symbol: "solana", symbol: "SOL", market_cap_rank: 7 },
    { id: "weird", name: "Weird", symbol: "not valid!" },
  ],
  exchanges: [],
};

describe("parseFinnhubSearch", () => {
  it("keeps stocks and ETFs with their Finnhub ticker, skips other types and empty names", () => {
    expect(parseFinnhubSearch(finnhubBody)).toEqual([
      { symbol: "AAPL", name: "Apple Inc.", assetClass: "stock", providerRefs: { finnhub: "AAPL" } },
      { symbol: "VOO", name: "VANGUARD S&P 500 ETF", assetClass: "etf", providerRefs: { finnhub: "VOO" } },
    ]);
    expect(parseFinnhubSearch({})).toEqual([]);
  });
});

describe("parseCoinGeckoSearch", () => {
  it("keeps coins with an uppercase symbol and the CoinGecko id", () => {
    expect(parseCoinGeckoSearch(coingeckoBody)).toEqual([
      { symbol: "SOL", name: "Solana", assetClass: "crypto", providerRefs: { coingecko: "solana" } },
    ]);
    expect(parseCoinGeckoSearch(null)).toEqual([]);
  });
});

describe("searchAssets", () => {
  it("asks both providers and lists crypto first", async () => {
    const { fetchImpl, calls } = fakeFetch([
      (url) => (url.includes("finnhub") ? { body: finnhubBody } : undefined),
      (url) => (url.includes("coingecko") ? { body: coingeckoBody } : undefined),
    ]);
    const found = await searchAssets(" so ", { finnhubApiKey: "k", fetch: fetchImpl });
    expect(calls).toHaveLength(2);
    expect(calls.find((c) => c.url.includes("finnhub"))!.url).toContain("exchange=US");
    expect(found.map((c) => c.symbol)).toEqual(["SOL", "AAPL", "VOO"]);
  });

  it("still returns crypto when Finnhub fails, and skips Finnhub without a key", async () => {
    const failing = fakeFetch([
      (url) => (url.includes("finnhub") ? { status: 429, body: "limit" } : { body: coingeckoBody }),
    ]);
    expect(await searchAssets("sol", { finnhubApiKey: "k", fetch: failing.fetchImpl })).toHaveLength(1);

    const noKey = fakeFetch([() => ({ body: coingeckoBody })]);
    await searchAssets("sol", { fetch: noKey.fetchImpl });
    expect(noKey.calls.every((c) => !c.url.includes("finnhub"))).toBe(true);
  });

  it("does not search for less than 2 characters", async () => {
    const { fetchImpl, calls } = fakeFetch([]);
    expect(await searchAssets("s", { fetch: fetchImpl })).toEqual([]);
    expect(calls).toHaveLength(0);
  });
});
