import { describe, expect, it } from "vitest";
import { binanceSymbol, createBinanceProvider, miniTickerStream, parseBinanceTickers } from "./binance";
import { asset, binancePairs, fakeFetch } from "./test-helpers";

const ticker = (symbol: string, lastPrice: string, priceChangePercent = "1.250") => ({
  symbol,
  lastPrice,
  priceChangePercent,
  openPrice: "1",
});

describe("binanceSymbol", () => {
  it("pairs crypto with USDT and lets provider_refs override it", () => {
    expect(binanceSymbol(asset("BTC"))).toBe("BTCUSDT");
    expect(binanceSymbol(asset("WBTC", "crypto", { binance: "wbtcbtc" }))).toBe("WBTCBTC");
  });

  it("has no pair for stocks or for USDT itself", () => {
    expect(binanceSymbol(asset("AAPL", "stock"))).toBeNull();
    expect(binanceSymbol(asset("USDT"))).toBeNull();
  });

  it("builds lowercase mini ticker stream names", () => {
    expect(miniTickerStream("BTCUSDT")).toBe("btcusdt@miniTicker");
  });
});

describe("parseBinanceTickers", () => {
  const btc = asset("BTC");
  const map = new Map([["BTCUSDT", [btc]]]);

  it("keeps the exact decimal text of the price and change", () => {
    expect(parseBinanceTickers([ticker("BTCUSDT", "64890.22000000", "-0.512")], map)).toEqual([
      { assetId: btc.id, price: "64890.22000000", dayChangePct: "-0.512", source: "binance" },
    ]);
  });

  it("accepts a single object and skips zero prices and malformed rows", () => {
    expect(parseBinanceTickers(ticker("BTCUSDT", "1.5"), map)).toHaveLength(1);
    expect(parseBinanceTickers([ticker("BTCUSDT", "0.00000000")], map)).toEqual([]);
    expect(parseBinanceTickers([{ symbol: "BTCUSDT", lastPrice: 5 }], map)).toEqual([]);
    expect(parseBinanceTickers([ticker("ETHUSDT", "3000")], map)).toEqual([]);
  });
});

describe("createBinanceProvider", () => {
  it("asks for all pairs in one request on the market-data host", async () => {
    const { fetchImpl, calls } = fakeFetch([
      (url) => ({ body: binancePairs(url).map((p) => ticker(p, "10")) }),
    ]);
    const quotes = await createBinanceProvider(fetchImpl).getQuotes([asset("BTC"), asset("ETH"), asset("AAPL", "stock")]);
    expect(calls).toHaveLength(1);
    expect(calls[0].url.startsWith("https://data-api.binance.vision/api/v3/ticker/24hr?symbols=")).toBe(true);
    expect(binancePairs(calls[0].url)).toEqual(["BTCUSDT", "ETHUSDT"]);
    expect(quotes.map((q) => q.assetId)).toEqual(["id-BTC", "id-ETH"]);
  });

  it("retries one by one when a pair is unknown (-1121) and skips that pair", async () => {
    const invalid = { status: 400, body: { code: -1121, msg: "Invalid symbol." } };
    const { fetchImpl, calls } = fakeFetch([
      (url) => (binancePairs(url).includes("NOPEUSDT") ? invalid : undefined),
      (url) => ({ body: binancePairs(url).map((p) => ticker(p, "2")) }),
    ]);
    const quotes = await createBinanceProvider(fetchImpl).getQuotes([asset("BTC"), asset("NOPE")]);
    expect(calls).toHaveLength(3);
    expect(quotes.map((q) => q.assetId)).toEqual(["id-BTC"]);
  });

  it("throws on other errors, such as a blocked region (451)", async () => {
    const { fetchImpl } = fakeFetch([() => ({ status: 451, body: "restricted location" })]);
    await expect(createBinanceProvider(fetchImpl).getQuotes([asset("BTC")])).rejects.toThrow("HTTP 451");
  });

  it("does not call the network without crypto", async () => {
    const { fetchImpl, calls } = fakeFetch([]);
    expect(await createBinanceProvider(fetchImpl).getQuotes([asset("AAPL", "stock")])).toEqual([]);
    expect(calls).toHaveLength(0);
  });
});
