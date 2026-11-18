/**
 * Amounts and currencies as crypto exchanges write them. Pure and tested.
 */
import { Dec } from "@/domain";

/**
 * Coins pegged 1:1 to the US dollar. A price paid in USDC is treated as a
 * price in USD (the peg can drift by a fraction of a cent).
 */
export const USD_STABLECOINS = new Set(["USDC", "USDT", "FDUSD", "BUSD", "DAI", "TUSD", "USDP", "PYUSD"]);

/** Currencies the European Central Bank publishes rates for (the server converts them to USD). */
export const FIAT = new Set([
  "USD", "EUR", "DKK", "SEK", "NOK", "GBP", "CHF", "PLN", "CZK", "HUF", "RON", "BGN", "ISK",
  "TRY", "JPY", "CNY", "HKD", "SGD", "KRW", "INR", "IDR", "MYR", "PHP", "THB", "AUD", "NZD",
  "CAD", "MXN", "BRL", "ZAR", "ILS",
]);

/** "USDC" → "USD"; "EUR" → "EUR"; a crypto coin → null. */
export function moneyCurrency(code: string): string | null {
  const upper = code.toUpperCase();
  if (USD_STABLECOINS.has(upper)) return "USD";
  return FIAT.has(upper) ? upper : null;
}

/** "0.0289", "1.79779E-5" → Dec; anything else → null. Dot decimals only. */
export function plainDecimal(text: string): Dec | null {
  const t = text.trim();
  if (!/^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(t)) return null;
  return new Dec(t);
}

/** "196.00 EUR", "0.0289ETH", "87.195924USDC" → { amount, code }; null if it doesn't look like that. */
export function splitAmount(text: string): { amount: Dec; code: string } | null {
  const m = /^(-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)\s*([A-Za-z][A-Za-z0-9]*)$/.exec(text.trim());
  if (!m) return null;
  return { amount: new Dec(m[1]), code: m[2].toUpperCase() };
}

/** A division kept to 10 decimals, written without exponent. */
export function ratio(a: Dec, b: Dec): string {
  return a.div(b).toDecimalPlaces(10).toFixed();
}

/**
 * "2026-06-01 18:49:23" read at a fixed UTC offset in minutes → ISO in UTC.
 * Null when the text is not a real date and time.
 */
export function dateTimeAtOffset(text: string, offsetMinutes: number): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(text.trim());
  if (!m) return null;
  const [year, month, day, hour, minute, second] = m.slice(1).map((v) => Number(v ?? 0));
  const wall = Date.UTC(year, month - 1, day, hour, minute, second);
  const check = new Date(wall);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) {
    return null;
  }
  return new Date(wall - offsetMinutes * 60_000).toISOString();
}
