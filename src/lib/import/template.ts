/**
 * Reader for the The Wire CSV template: one simple layout for any broker
 * (decision 103). The empty template is served at /the-wire-template.csv.
 *
 *   date        2026-11-13 (stored at noon UTC) or 2026-11-13 14:30 (the user's time zone)
 *   type        buy | sell | dividend | reward  (Spanish also works: compra, venta, dividendo, recompensa)
 *   symbol      ticker or coin, e.g. AAPL, BTC
 *   asset_type  stock | etf | crypto
 *   quantity    > 0
 *   price       price per unit (per share for a dividend); ≥ 0
 *   fee         optional, ≥ 0
 *   currency    optional, default USD; converted to USD when saved
 *   broker, note  optional text
 *
 * Commas or semicolons separate cells (Excel in Europe saves with ";"); numbers
 * may use a dot or a comma as decimal mark, and ambiguous ones are rejected.
 * The template has no id column, so a row's dedupe key is a fingerprint of
 * its content; identical rows in one file are told apart by their order.
 */
import type { TransactionType } from "@/domain";
import { parseDecimalInput, zonedLocalToUtc } from "@/lib/portfolio/parse";
import { dateAtNoonUtc, isBlankRow, isIsoDate, parseDelimited } from "./delimited";
import { moneyCurrency } from "./money";
import type { ImportResult, ImportedAsset, ImportedTransaction, RowError, RowErrorCode } from "./types";

export const TEMPLATE_HEADERS = [
  "date",
  "type",
  "symbol",
  "asset_type",
  "quantity",
  "price",
  "fee",
  "currency",
  "broker",
  "note",
] as const;

const REQUIRED = ["date", "type", "symbol", "asset_type", "quantity", "price"];

const TYPES: Record<string, TransactionType> = {
  buy: "buy",
  sell: "sell",
  dividend: "dividend",
  reward: "reward",
  compra: "buy",
  venta: "sell",
  dividendo: "dividend",
  recompensa: "reward",
};

const KINDS: Record<string, ImportedAsset["kind"]> = { stock: "stock", etf: "etf", crypto: "crypto" };

const SYMBOL = /^[A-Z0-9.\-]{1,20}$/;

class RowProblem extends Error {
  constructor(
    readonly code: RowErrorCode,
    readonly field: string,
  ) {
    super(`${code}: ${field}`);
  }
}

/** cyrb53: a small, fast 53-bit string hash. Enough to tell one user's rows apart. */
function fingerprint(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

function decimal(text: string, field: string): string {
  const parsed = parseDecimalInput(text);
  if (!parsed.ok) throw new RowProblem(parsed.error === "required" ? "missing_field" : "invalid_number", field);
  return parsed.value;
}

/** Null when the text is not a The Wire template. */
export function parseTemplate(text: string, timeZone: string): ImportResult | null {
  const firstLine = text.replace(/^﻿/, "").split(/\r?\n/, 1)[0] ?? "";
  const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
  const rows = parseDelimited(text, delimiter);
  const header = (rows[0] ?? []).map((cell) => cell.trim().toLowerCase());
  if (!REQUIRED.every((name) => header.includes(name))) return null;

  const transactions: ImportedTransaction[] = [];
  const errors: RowError[] = [];
  const seen = new Map<string, number>();

  rows.slice(1).forEach((cells, i) => {
    if (isBlankRow(cells)) return;
    const line = i + 2;
    const get = (name: string) => (header.includes(name) ? (cells[header.indexOf(name)] ?? "").trim() : "");
    try {
      const rawDate = get("date");
      let executedAt: string | null = null;
      if (isIsoDate(rawDate)) executedAt = dateAtNoonUtc(rawDate);
      else if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(rawDate)) {
        executedAt = zonedLocalToUtc(rawDate.replace(" ", "T"), timeZone);
      }
      if (!executedAt) throw new RowProblem("invalid_date", "date");

      const type = TYPES[get("type").toLowerCase()];
      if (!type) throw new RowProblem("invalid_value", "type");
      const symbol = get("symbol").toUpperCase();
      if (!SYMBOL.test(symbol)) throw new RowProblem("invalid_value", "symbol");
      const kind = KINDS[get("asset_type").toLowerCase()];
      if (!kind) throw new RowProblem("invalid_value", "asset_type");

      const quantity = decimal(get("quantity"), "quantity");
      if (!/[1-9]/.test(quantity)) throw new RowProblem("invalid_number", "quantity");
      const unitPrice = decimal(get("price"), "price");
      const fee = get("fee") === "" ? null : decimal(get("fee"), "fee");
      const currency = moneyCurrency(get("currency") || "USD");
      if (!currency) throw new RowProblem("invalid_value", "currency");

      const content = [executedAt, type, symbol, kind, quantity, unitPrice, fee ?? "", currency].join("|");
      const occurrence = (seen.get(content) ?? 0) + 1;
      seen.set(content, occurrence);

      const brokerName = get("broker").slice(0, 80);
      const note = get("note").slice(0, 1000);
      transactions.push({
        broker: "thewire",
        externalId: `${fingerprint(content)}-${occurrence}`,
        line,
        type,
        asset: { kind, symbol, name: symbol },
        quantity,
        unitPrice,
        fee: fee && /[1-9]/.test(fee) ? fee : null,
        currency,
        executedAt,
        ...(brokerName ? { brokerName } : {}),
        ...(note ? { note } : {}),
      });
    } catch (error) {
      if (!(error instanceof RowProblem)) throw error;
      errors.push({ line, code: error.code, field: error.field });
    }
  });

  transactions.sort((a, b) => a.executedAt.localeCompare(b.executedAt) || a.line - b.line);
  return { ok: true, broker: "thewire", transactions, skipped: [], errors };
}
