import { describe, expect, it } from "vitest";
import { createFinnhubProvider, parseFinnhubQuote } from "./finnhub";
import { asset, fakeFetch } from "./test-helpers";

describe("parseFinnhubQuote", () => {
  const aapl = asset("AAPL", "stock");

  it("reads c (current) and dp (percent change)", () => {
    const body = { c: 189.2, d: 2.24, dp: 1.198, h: 190, l: 187, o: 188, pc: 186.96, t: 1 };
    expect(parseFinnhubQuote(body, aapl)).toEqual({
      assetId: aapl.id,
      price: "189.2",
      dayChangePct: "1.198",
      source: "finnhub",
    });
  });

  it("treats c = 0 (unknown symbol) as no price", () => {
    expect(parseFinnhubQuote({ c: 0, d: null, dp: null }, aapl)).toBeNull();
    expect(parseFinnhubQuote("oops", aapl)).toBeNull();
  });
});

describe("createFinnhubProvider", () => {
  it("asks once per stock or ETF with the token, and skips crypto", async () => {
    const { fetchImpl, calls } = fakeFetch([() => ({ body: { c: 10, dp: -0.5 } })]);
    const quotes = await createFinnhubProvider("key", fetchImpl).getQuotes([
      asset("AAPL", "stock"),
      asset("VOO", "etf"),
      asset("BTC"),
    ]);
    expect(calls.map((c) => new URL(c.url).searchParams.get("symbol"))).toEqual(["AAPL", "VOO"]);
    expect(calls.every((c) => new URL(c.url).searchParams.get("token") === "key")).toBe(true);
    expect(quotes).toHaveLength(2);
  });
});
