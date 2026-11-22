import { describe, expect, it } from "vitest";
import { binanceDailyCloses, parseKlines, parseTiingo, tiingoDailyCloses, tiingoTicker } from "./history";
import { fakeFetch } from "./test-helpers";

const DAY = 86_400_000;
const T0 = Date.parse("2026-11-16T00:00:00Z");
/** A kline row like Binance sends it. */
const kline = (openTime: number, close: string) => [
  openTime,
  "1",
  "1",
  "1",
  close,
  "10",
  openTime + DAY - 1,
  "0",
  1,
  "0",
  "0",
  "0",
];

describe("parseKlines", () => {
  it("keeps finished days, as exact text, and drops today's moving candle", () => {
    const body = [kline(T0, "91000.50000000"), kline(T0 + DAY, "92000.00000000"), kline(T0 + 2 * DAY, "93000.1")];
    expect(parseKlines(body, T0 + 2 * DAY + 3600_000)).toEqual([
      { day: "2026-11-16", close: "91000.5" },
      { day: "2026-11-17", close: "92000" },
    ]);
  });

  it("ignores anything that isn't a kline", () => {
    expect(parseKlines({ code: -1121 }, T0)).toEqual([]);
    expect(parseKlines([["x"], kline(T0, "abc")], T0 + 5 * DAY)).toEqual([]);
  });
});

describe("binanceDailyCloses", () => {
  it("asks from the start day and returns nothing for a pair Binance doesn't list", async () => {
    const { fetchImpl, calls } = fakeFetch([
      (url) => (url.includes("symbol=BTCUSDT") ? { body: [kline(T0, "91000")] } : undefined),
      (url) => (url.includes("symbol=NOPEUSDT") ? { status: 400, body: { code: -1121 } } : undefined),
    ]);
    expect(await binanceDailyCloses(fetchImpl, "BTCUSDT", "2026-11-16", T0 + 2 * DAY)).toEqual([
      { day: "2026-11-16", close: "91000" },
    ]);
    expect(calls[0].url).toContain(`startTime=${T0}`);
    expect(calls[0].url).toContain("interval=1d");
    expect(await binanceDailyCloses(fetchImpl, "NOPEUSDT", "2026-11-16", T0 + 2 * DAY)).toEqual([]);
  });

  it("follows pages of 1000 days", async () => {
    const start = Date.parse("2023-01-01T00:00:00Z");
    const pageOne = Array.from({ length: 1000 }, (_, i) => kline(start + i * DAY, "1"));
    const pageTwo = [kline(start + 1000 * DAY, "2")];
    const { fetchImpl, calls } = fakeFetch([
      (url) => (url.includes(`startTime=${start}&`) ? { body: pageOne } : undefined),
      (url) => (url.includes(`startTime=${start + 1000 * DAY}&`) ? { body: pageTwo } : undefined),
    ]);
    const closes = await binanceDailyCloses(fetchImpl, "BTCUSDT", "2023-01-01", start + 1100 * DAY);
    expect(closes).toHaveLength(1001);
    expect(calls).toHaveLength(2);
  });
});

describe("tiingo", () => {
  const row = (date: string, close: number, splitFactor = 1) => ({
    date: `${date}T00:00:00.000Z`,
    close,
    splitFactor,
  });

  it("writes share classes with a dash", () => {
    expect(tiingoTicker("brk.b")).toBe("BRK-B");
    expect(tiingoTicker("AAPL")).toBe("AAPL");
  });

  it("adjusts closes before a split so they match today's share count", () => {
    // A 10-for-1 split on 2026-06-10: the old $1,200 close is $120 in today's shares.
    const { closes, split } = parseTiingo([
      row("2026-06-09", 1200),
      row("2026-06-10", 121, 10),
      row("2026-06-11", 125.5),
    ]);
    expect(closes).toEqual([
      { day: "2026-06-09", close: "120" },
      { day: "2026-06-10", close: "121" },
      { day: "2026-06-11", close: "125.5" },
    ]);
    expect(split).toBe(true);
  });

  it("does not flag a split on the first row (earlier closes already account for it)", () => {
    expect(parseTiingo([row("2026-06-10", 121, 10), row("2026-06-11", 125)]).split).toBe(false);
    expect(parseTiingo({ detail: "Error" })).toEqual({
      closes: [],
      split: false,
    });
  });

  it("sends the key in the Authorization header and treats 404 as no data", async () => {
    const { fetchImpl, calls } = fakeFetch([
      (url) => (url.includes("/AAPL/prices") ? { body: [row("2026-11-20", 271.49)] } : undefined),
    ]);
    const result = await tiingoDailyCloses(fetchImpl, "secret", "AAPL", "2026-11-20");
    expect(result.closes).toEqual([{ day: "2026-11-20", close: "271.49" }]);
    expect(calls[0].url).toBe("https://api.tiingo.com/tiingo/daily/AAPL/prices?startDate=2026-11-20&format=json");
    expect(calls[0].headers.authorization).toBe("Token secret");
    expect(calls[0].url).not.toContain("secret");
    expect(await tiingoDailyCloses(fetchImpl, "secret", "ZZZZ", "2026-11-20")).toEqual({ closes: [], split: false });
  });
});
