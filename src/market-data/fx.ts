import { getJson, numberToDecimalText } from "./http";
import type { FetchLike } from "./types";

/*
 * Daily exchange rates from the European Central Bank, through Frankfurter
 * (free, no key): GET /v1/2026-06-01?base=USD&symbols=DKK,EUR
 *   → { amount: 1, base: "USD", date: "2026-06-01", rates: { DKK: 6.4212, EUR: 0.85911 } }
 * A weekend or holiday answers with the last business day before it.
 * Used by the import to turn prices paid in EUR, DKK… into USD.
 */
export const FRANKFURTER_API = "https://api.frankfurter.dev/v1";

export interface UsdRates {
  /** The ECB day the rates belong to (may be before the requested day). */
  date: string;
  /** Units of each currency per 1 USD, as exact decimal text. */
  rates: Record<string, string>;
}

export function parseFrankfurterRates(body: unknown): UsdRates | null {
  const { base, date, rates } = (body ?? {}) as Record<string, unknown>;
  if (base !== "USD" || typeof date !== "string" || typeof rates !== "object" || rates === null) return null;
  const parsed: Record<string, string> = {};
  for (const [code, value] of Object.entries(rates)) {
    const text = numberToDecimalText(value);
    if (/^[A-Z]{3}$/.test(code) && text && text !== "0") parsed[code] = text;
  }
  return { date, rates: parsed };
}

/** Rates for one day. Throws on a network or API failure. */
export async function fetchUsdRates(
  day: string,
  currencies: readonly string[],
  fetchImpl: FetchLike = fetch,
): Promise<UsdRates> {
  const symbols = currencies.filter((c) => /^[A-Z]{3}$/.test(c) && c !== "USD").join(",");
  const body = await getJson(fetchImpl, "frankfurter", `${FRANKFURTER_API}/${day}?base=USD&symbols=${symbols}`);
  const parsed = parseFrankfurterRates(body);
  if (!parsed) throw new Error("Frankfurter sent an unexpected answer");
  return parsed;
}
