import type { DecimalInput } from "./decimal";

export const TRANSACTION_TYPES = [
  "buy",
  "sell",
  "deposit",
  "withdrawal",
  "dividend",
  "reward",
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/**
 * One row of the ledger, as the domain needs it.
 *
 * Numbers are strings (Postgres `numeric` arrives as text) or Decimals.
 * Dates are ISO 8601 strings in UTC.
 */
export interface Transaction {
  id: string;
  type: TransactionType;
  /** Always positive. Shares, coins, or cash units for deposit/withdrawal. */
  quantity: DecimalInput;
  /** Price per unit in USD. Use "1" for cash deposits and withdrawals. */
  unitPrice: DecimalInput;
  /** Optional, never negative. */
  fee?: DecimalInput | null;
  executedAt: string;
  createdAt: string;
}

export type PortfolioErrorCode =
  | "invalid_amount"
  | "invalid_date"
  | "sell_exceeds_quantity";

/** Raised when the ledger cannot be replayed (bad input or an impossible sell). */
export class PortfolioError extends Error {
  constructor(
    readonly code: PortfolioErrorCode,
    readonly transactionId: string,
    message: string,
  ) {
    super(message);
    this.name = "PortfolioError";
  }
}
