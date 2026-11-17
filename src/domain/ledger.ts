import { Dec, toDec } from "./decimal";
import { PortfolioError, type Transaction } from "./types";

/** A transaction with its numbers parsed and checked. */
export interface ParsedTransaction {
  source: Transaction;
  quantity: Dec;
  unitPrice: Dec;
  fee: Dec;
  /** quantity × unitPrice, before fees. */
  gross: Dec;
}

function timeOf(tx: Transaction, field: "executedAt" | "createdAt"): number {
  const ms = Date.parse(tx[field]);
  if (Number.isNaN(ms)) {
    throw new PortfolioError("invalid_date", tx.id, `Invalid ${field}: ${tx[field]}`);
  }
  return ms;
}

/**
 * Ledger order: `executedAt`, then `createdAt`, then `id` so the result
 * never depends on the order rows came from the database.
 */
export function sortTransactions(transactions: readonly Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) =>
      timeOf(a, "executedAt") - timeOf(b, "executedAt") ||
      timeOf(a, "createdAt") - timeOf(b, "createdAt") ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}

/** Rules: quantity > 0, unit price ≥ 0, fee ≥ 0. */
export function parseTransaction(tx: Transaction): ParsedTransaction {
  let quantity: Dec;
  let unitPrice: Dec;
  let fee: Dec;
  try {
    quantity = toDec(tx.quantity);
    unitPrice = toDec(tx.unitPrice);
    fee = toDec(tx.fee);
  } catch {
    throw new PortfolioError("invalid_amount", tx.id, "Amounts must be decimal numbers");
  }
  if (!quantity.isFinite() || !quantity.gt(0)) {
    throw new PortfolioError("invalid_amount", tx.id, "Quantity must be greater than 0");
  }
  if (!unitPrice.isFinite() || unitPrice.isNeg()) {
    throw new PortfolioError("invalid_amount", tx.id, "Unit price cannot be negative");
  }
  if (!fee.isFinite() || fee.isNeg()) {
    throw new PortfolioError("invalid_amount", tx.id, "Fee cannot be negative");
  }
  return { source: tx, quantity, unitPrice, fee, gross: quantity.times(unitPrice) };
}
