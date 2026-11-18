/**
 * Display formatting. This is the only place where numbers are rounded
 * (AGENTS.md: round only for display). Values arrive as exact decimal strings
 * or Decimals and are handed to Intl as strings, so no float is involved.
 */
import type { Dec } from "@/domain";

type Exact = string | Dec;

/** Plain decimal text, never exponential ("1e-8" → "0.00000001"). */
function exact(value: Exact): Intl.StringNumericLiteral {
  return (typeof value === "string" ? value : value.toFixed()) as Intl.StringNumericLiteral;
}

/** Quantities: up to 8 decimals (satoshis), no trailing zeros. */
export function formatQuantity(value: Exact, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }).format(exact(value));
}

/**
 * US dollars. Amounts under 1 keep up to 8 decimals so small crypto prices
 * stay readable; larger amounts use cents.
 */
export function formatUsd(value: Exact, locale: string): string {
  const text = exact(value);
  const small = Math.abs(Number(text)) < 1 && Number(text) !== 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: small ? 8 : 2,
  }).format(text);
}

/**
 * Short US dollars for tight spots like the donut's center: "$161K",
 * "$1.2M". Same look in every language (Intl's compact style would write
 * "161 mil US$" in Spanish); only the decimal mark follows the locale.
 */
export function formatUsdCompact(value: Exact, locale: string): string {
  const text = exact(value);
  const n = Math.abs(Number(text)); // display only: picks the suffix
  const sign = Number(text) < 0 ? "−" : "";
  const steps: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  const step = steps.find(([size]) => n >= size);
  if (!step) {
    return `${sign}$${new Intl.NumberFormat(locale, { maximumFractionDigits: n < 1 ? 2 : 0 }).format(n)}`;
  }
  const short = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n / step[0]);
  return `${sign}$${short}${step[1]}`;
}

/** A date and time in the user's time zone. */
export function formatDateTime(iso: string, locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** Just the date, in the user's time zone. */
export function formatDate(iso: string, locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: "medium" }).format(new Date(iso));
}

/** A fraction as a percent with up to 2 decimals, without sign (0.0125 → "1.25 %"). */
export function formatPercent(fraction: Exact, locale: string): string {
  const text = exact(fraction).replace(/^-/, "");
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(
    text as Intl.StringNumericLiteral,
  );
}

/** How long ago, in words ("5 minutes ago", "hace 5 minutos"). */
export function formatAge(iso: string, now: number, locale: string): string {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (seconds < 60) return rtf.format(-seconds, "second");
  if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), "minute");
  if (seconds < 86_400) return rtf.format(-Math.floor(seconds / 3600), "hour");
  return rtf.format(-Math.floor(seconds / 86_400), "day");
}
