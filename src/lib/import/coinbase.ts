/**
 * Reader for the Coinbase account statement CSV, checked against a real file (2026-11-18).
 *
 * A few lines come before the table ("Transactions", "User,<name>,<id>"), then:
 *   ID, Timestamp, Transaction Type, Asset, Quantity Transacted, Price Currency,
 *   Price at Transaction, Subtotal, Total (inclusive of fees and/or spread),
 *   Fees and/or Spread, Notes, Sender Address, Recipient Address
 * Timestamps are "2026-11-13 12:17:05 UTC"; money is "$69433.07…" or "-$962.73…".
 *
 *   Buy:  quantity, price = Price at Transaction, fee = Fees and/or Spread
 *         (Total = Subtotal + fee = quantity × price + fee)
 *   Sell: the same with the quantity made positive
 *   Send / Receive of a coin: a move between wallets, not a buy or sell → skipped
 *   Deposit / Withdrawal of money (EUR, USD…): cash → skipped (decision 106)
 * Other types (rewards, conversions, Advanced Trade…) are listed as unsupported
 * until a real row has been checked.
 */
import type { Dec } from "@/domain";
import { isBlankRow, parseDelimited } from "./delimited";
import { dateTimeAtOffset, moneyCurrency, plainDecimal } from "./money";
import type {
  ImportResult,
  ImportedTransaction,
  RowError,
  RowErrorCode,
  SkippedRow,
  SkipReason,
} from "./types";

const REQUIRED = [
  "ID",
  "Timestamp",
  "Transaction Type",
  "Asset",
  "Quantity Transacted",
  "Price Currency",
  "Price at Transaction",
  "Fees and/or Spread",
];

class RowProblem extends Error {
  constructor(
    readonly code: RowErrorCode,
    readonly field: string,
  ) {
    super(`${code}: ${field}`);
  }
}

/** "-$962.73665" / "$1.10" / "0.5" → Dec; "" → null. */
function money(text: string, field: string): Dec | null {
  if (text === "") return null;
  const value = plainDecimal(text.replace(/^(-?)[$€£]/, "$1"));
  if (!value) throw new RowProblem("invalid_number", field);
  return value;
}

/** Null when the text is not a Coinbase statement. */
export function parseCoinbase(text: string): ImportResult | null {
  const rows = parseDelimited(text, ",");
  const headerIndex = rows.findIndex((r) => REQUIRED.every((name) => r.map((c) => c.trim()).includes(name)));
  if (headerIndex === -1 || headerIndex > 10) return null;
  const header = rows[headerIndex].map((c) => c.trim());

  const transactions: ImportedTransaction[] = [];
  const skipped: SkippedRow[] = [];
  const errors: RowError[] = [];

  rows.slice(headerIndex + 1).forEach((cells, i) => {
    if (isBlankRow(cells)) return;
    const line = headerIndex + i + 2;
    const get = (name: string) => (cells[header.indexOf(name)] ?? "").trim();
    const type = get("Transaction Type");
    const coin = get("Asset").toUpperCase();
    const day = get("Timestamp").slice(0, 10);
    const skip = (reason: SkipReason, label = coin || type) =>
      skipped.push({ line, reason, label, ...(/^\d{4}-\d{2}-\d{2}$/.test(day) ? { date: day } : {}) });

    try {
      if (type === "Buy" || type === "Sell") {
        const stamp = get("Timestamp");
        const iso = /\sUTC$/.test(stamp) ? dateTimeAtOffset(stamp.replace(/\s+UTC$/, ""), 0) : null;
        if (!iso) throw new RowProblem("invalid_date", "Timestamp");
        const quantity = money(get("Quantity Transacted"), "Quantity Transacted")?.abs();
        const price = money(get("Price at Transaction"), "Price at Transaction");
        const fee = money(get("Fees and/or Spread"), "Fees and/or Spread");
        if (!quantity || quantity.lte(0)) throw new RowProblem("invalid_number", "Quantity Transacted");
        if (!price || price.lt(0)) throw new RowProblem("invalid_number", "Price at Transaction");
        const currency = moneyCurrency(get("Price Currency"));
        if (!currency) return skip("unsupported_currency");
        transactions.push({
          broker: "coinbase",
          externalId: get("ID") || `${stamp}|${coin}|${get("Quantity Transacted")}`,
          line,
          type: type === "Buy" ? "buy" : "sell",
          asset: { kind: "crypto", symbol: coin, name: coin },
          quantity: quantity.toFixed(),
          unitPrice: price.toFixed(),
          fee: fee && !fee.isZero() ? fee.abs().toFixed() : null,
          currency,
          executedAt: iso,
        });
      } else if (type === "Send" || type === "Receive") {
        skip("transfer");
      } else if (type === "Deposit" || type === "Withdrawal") {
        skip(moneyCurrency(coin) ? "cash_movement" : "transfer");
      } else {
        skip("unsupported_type", `${type} ${coin}`.trim());
      }
    } catch (error) {
      if (!(error instanceof RowProblem)) throw error;
      errors.push({ line, code: error.code, field: error.field });
    }
  });

  transactions.sort((a, b) => a.executedAt.localeCompare(b.executedAt) || a.line - b.line);
  return { ok: true, broker: "coinbase", transactions, skipped, errors };
}
