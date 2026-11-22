import Decimal from "decimal.js";
import { BINANCE_REST } from "./binance";
import { getJson, numberToDecimalText, ProviderHttpError } from "./http";
import type { FetchLike } from "./types";

/*
 * Daily closing prices for the performance chart (decision 113).
 *  - Crypto: Binance klines (public, no key), one candle per UTC day.
 *    GET /api/v3/klines?symbol=BTCUSDT&interval=1d&startTime=<ms>&limit=1000
 *    → [[openTime, open, high, low, close, volume, closeTime, …], …]
 *  - Stocks and ETFs: Tiingo end-of-day prices (free account, personal use only).
 *    GET https://api.tiingo.com/tiingo/daily/<ticker>/prices?startDate=2026-01-01
 *    with "Authorization: Token <key>"
 *    → [{ date: "2026-11-10T00:00:00.000Z", close: 348.51, splitFactor: 1, … }]
 *    Free plan: 50 requests per hour, 1000 per day, 500 symbols per month.
 * Finnhub's free plan has no history (its candle endpoint answers 403).
 */

export const TIINGO_API = "https://api.tiingo.com/tiingo/daily";

/** One closing price as exact decimal text, on a UTC day ("2026-11-20"). */
export interface HistoryClose {
  day: string;
  close: string;
}

const KLINE_LIMIT = 1000;
const DAY_MS = 86_400_000;

/** Binance klines → closes of finished days only (today's candle is still moving). */
export function parseKlines(body: unknown, now: number): HistoryClose[] {
  if (!Array.isArray(body)) return [];
  const closes: HistoryClose[] = [];
  for (const row of body) {
    if (!Array.isArray(row)) continue;
    const [openTime, , , , close, , closeTime] = row;
    if (typeof openTime !== "number" || typeof close !== "string" || typeof closeTime !== "number") continue;
    if (closeTime >= now || !/^\d+(\.\d+)?$/.test(close)) continue;
    const text = close.includes(".") ? close.replace(/\.?0+$/, "") : close;
    closes.push({
      day: new Date(openTime).toISOString().slice(0, 10),
      close: text,
    });
  }
  return closes;
}

/** Daily closes of a Binance pair from `startDay`, page by page (1000 days each). */
export async function binanceDailyCloses(
  fetchImpl: FetchLike,
  pair: string,
  startDay: string,
  now: number,
): Promise<HistoryClose[]> {
  const closes: HistoryClose[] = [];
  let start = Date.parse(`${startDay}T00:00:00Z`);
  while (start < now) {
    const url = `${BINANCE_REST}/api/v3/klines?symbol=${encodeURIComponent(pair)}&interval=1d&startTime=${start}&limit=${KLINE_LIMIT}`;
    let body: unknown;
    try {
      body = await getJson(fetchImpl, "binance", url);
    } catch (error) {
      // 400 "Invalid symbol": Binance doesn't list this coin.
      if (error instanceof ProviderHttpError && error.status === 400) return [];
      throw error;
    }
    const page = parseKlines(body, now);
    closes.push(...page);
    if (!Array.isArray(body) || body.length < KLINE_LIMIT || page.length === 0) break;
    start = Date.parse(`${page[page.length - 1].day}T00:00:00Z`) + DAY_MS;
  }
  return closes;
}

/** Tiingo writes share classes with a dash: "BRK.B" → "BRK-B". */
export function tiingoTicker(symbol: string): string {
  return symbol.trim().toUpperCase().replaceAll(".", "-");
}

/**
 * Tiingo rows → split-adjusted closes. Trades are entered with today's
 * split-adjusted numbers (decision 63), so each raw close is divided by every
 * split that came after it:
 *
 *   adjusted(d) = close(d) / Π splitFactor(later days)
 *
 * (Tiingo's adjClose also takes dividends out, which would not match the
 * prices the user paid.) `split` is true when a split happened after the
 * first row, so closes saved before this range need fetching again.
 */
export function parseTiingo(body: unknown): {
  closes: HistoryClose[];
  split: boolean;
} {
  if (!Array.isArray(body)) return { closes: [], split: false };
  const rows: { day: string; close: Decimal; factor: Decimal }[] = [];
  for (const row of body) {
    const { date, close, splitFactor } = (row ?? {}) as Record<string, unknown>;
    const closeText = numberToDecimalText(close);
    const factorText = numberToDecimalText(splitFactor ?? 1);
    if (typeof date !== "string" || closeText === null || factorText === null || factorText === "0") continue;
    rows.push({
      day: date.slice(0, 10),
      close: new Decimal(closeText),
      factor: new Decimal(factorText),
    });
  }
  rows.sort((a, b) => a.day.localeCompare(b.day));

  let later = new Decimal(1);
  const closes: HistoryClose[] = new Array(rows.length);
  for (let i = rows.length - 1; i >= 0; i--) {
    closes[i] = { day: rows[i].day, close: rows[i].close.div(later).toFixed() };
    later = later.times(rows[i].factor);
  }
  const split = rows.slice(1).some((r) => !r.factor.eq(1));
  return { closes, split };
}

/** Daily closes of a US stock or ETF from `startDay`; an unknown ticker gives none. */
export async function tiingoDailyCloses(
  fetchImpl: FetchLike,
  apiKey: string,
  symbol: string,
  startDay: string,
): Promise<{ closes: HistoryClose[]; split: boolean }> {
  const url = `${TIINGO_API}/${encodeURIComponent(tiingoTicker(symbol))}/prices?startDate=${startDay}&format=json`;
  try {
    return parseTiingo(
      await getJson(fetchImpl, "tiingo", url, {
        authorization: `Token ${apiKey}`,
      }),
    );
  } catch (error) {
    if (error instanceof ProviderHttpError && error.status === 404) return { closes: [], split: false };
    throw error;
  }
}
