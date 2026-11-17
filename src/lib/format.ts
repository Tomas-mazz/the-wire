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
