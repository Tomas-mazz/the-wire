/**
 * Text of the "Copy summary" button (decision 101): a short, chat-friendly
 * summary of one holding, a section or the whole portfolio. Pure: it gets
 * the numbers and the translated labels, and returns plain text.
 *
 * Percentages arrive as fractions (0.25 = 25 %). Money is rounded to whole
 * dollars from $100 up, and to cents below, only here at display time.
 */
import { toDec, type Dec } from "@/domain";

export interface SummaryLine {
  label: string;
  /** Fraction (0.25 = 25 %), or null when unknown. */
  pct: Dec | null;
  /** Money behind the %, shown only "with amounts". */
  amount: Dec | null;
}

export interface SummaryItem {
  symbol: string;
  /** Unrealized result as a fraction, or null without a price. */
  pct: Dec | null;
  amount: Dec | null;
}

export interface SummaryInput {
  title: string;
  /** Already formatted in the user's language and time zone. */
  date: string;
  /** Lines under the title, e.g. "Total" and "Today". */
  lines: SummaryLine[];
  /** One row per holding (empty for a single-holding summary). */
  items: SummaryItem[];
  withAmounts: boolean;
  locale: string;
  footer: string;
}

const MINUS = "−";

function percent(fraction: Dec, locale: string): string {
  const text = new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(fraction.abs().toFixed() as Intl.StringNumericLiteral);
  return `${fraction.isNegative() ? MINUS : "+"}${text}`;
}

function money(amount: Dec, locale: string): string {
  const whole = amount.abs().gte(100);
  const text = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount.abs().toFixed() as Intl.StringNumericLiteral);
  return `${amount.isNegative() ? MINUS : "+"}${text}`;
}

const arrow = (value: Dec) => (value.isNegative() ? "▼" : "▲");

/** "+14.5% (+$6,120)" or just "+14.5%". */
function result(pct: Dec | null, amount: Dec | null, withAmounts: boolean, locale: string): string | null {
  if (!pct) return null;
  const tail = withAmounts && amount ? ` (${money(amount, locale)})` : "";
  return `${percent(pct, locale)}${tail}`;
}

export function buildSummary(input: SummaryInput): string {
  const { withAmounts, locale } = input;
  const out = [`📊 ${input.title} · ${input.date}`];

  for (const line of input.lines) {
    const text = result(line.pct, line.amount, withAmounts, locale);
    if (text) out.push(`${line.label}: ${text}`);
  }

  const items = input.items.filter((i) => i.pct !== null);
  if (items.length > 0) {
    if (withAmounts) {
      // One aligned row per holding.
      const width = Math.max(...items.map((i) => i.symbol.length));
      out.push("");
      for (const item of items) {
        out.push(`${arrow(item.pct!)} ${item.symbol.padEnd(width)}  ${result(item.pct, item.amount, true, locale)}`);
      }
    } else {
      // Only %: everything on one line, easy to read in a chat.
      out.push(items.map((i) => `${arrow(i.pct!)} ${i.symbol} ${percent(i.pct!, locale)}`).join(" · "));
    }
  }

  out.push("", `— ${input.footer}`);
  return out.join("\n");
}

/** A provider's day change in percent (1.5 = 1.5 %) as a fraction, or null. */
export function dayFraction(dayChangePct: string | null | undefined): Dec | null {
  return dayChangePct ? toDec(dayChangePct).div(100) : null;
}
