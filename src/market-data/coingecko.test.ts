import { describe, expect, it } from "vitest";
import { createCoinGeckoProvider, parseCoinGeckoPrices } from "./coingecko";
import { asset, fakeFetch } from "./test-helpers";

describe("parseCoinGeckoPrices", () => {
  const btc = asset("BTC");
  const key = (a: { symbol: string }) => a.symbol.toLowerCase();

  it("reads usd and usd_24h_change as decimal text", () => {
    const body = { btc: { usd: 64947.12, usd_24h_change: -1.3364033255513466, last_updated_at: 1 } };
    expect(parseCoinGeckoPrices(body, [btc], key)).toEqual([
      { assetId: btc.id, price: "64947.12", dayChangePct: "-1.3364033255513466", source: "coingecko" },
    ]);
  });

  it("writes tiny prices without exponents", () => {
    const [quote] = parseCoinGeckoPrices({ btc: { usd: 1.2e-8 } }, [btc], key);
    expect(quote.price).toBe("0.000000012");
    expect(quote.dayChangePct).toBeNull();
  });

  it("skips missing, zero or invalid prices", () => {
    expect(parseCoinGeckoPrices({}, [btc], key)).toEqual([]);
    expect(parseCoinGeckoPrices({ btc: { usd: 0 } }, [btc], key)).toEqual([]);
    expect(parseCoinGeckoPrices({ btc: { usd: "1" } }, [btc], key)).toEqual([]);
    expect(parseCoinGeckoPrices(null, [btc], key)).toEqual([]);
  });
});

describe("createCoinGeckoProvider", () => {
  it("asks by symbol, or by id when provider_refs pins the coin, and sends the demo key", async () => {
    const { fetchImpl, calls } = fakeFetch([
      (url) => (url.includes("ids=") ? { body: { "wrapped-bitcoin": { usd: 2 } } } : undefined),
      () => ({ body: { btc: { usd: 1, usd_24h_change: 0.5 } } }),
    ]);
    const quotes = await createCoinGeckoProvider("demo-key", fetchImpl).getQuotes([
      asset("BTC"),
      asset("WBTC", "crypto", { coingecko: "wrapped-bitcoin" }),
      asset("AAPL", "stock"),
    ]);
    expect(calls).toHaveLength(2);
    expect(calls.every((c) => c.headers["x-cg-demo-api-key"] === "demo-key")).toBe(true);
    expect(calls.some((c) => c.url.includes("symbols=btc"))).toBe(true);
    expect(quotes.map((q) => [q.assetId, q.price])).toEqual([
      ["id-WBTC", "2"],
      ["id-BTC", "1"],
    ]);
  });

  it("works without a key (no header)", async () => {
    const { fetchImpl, calls } = fakeFetch([() => ({ body: { eth: { usd: 3 } } })]);
    await createCoinGeckoProvider(undefined, fetchImpl).getQuotes([asset("ETH")]);
    expect(calls[0].headers["x-cg-demo-api-key"]).toBeUndefined();
  });
});
