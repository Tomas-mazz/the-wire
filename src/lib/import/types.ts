/**
 * Shapes shared by every broker file reader (M7 import).
 * Readers are pure: text in, typed rows out. No React, no network.
 */
import type { TransactionType } from "@/domain";

export type ImportBroker = "nordnet" | "binance" | "coinbase" | "thewire";

export interface ImportedAsset {
  kind: "stock" | "etf" | "crypto";
  /** Ticker when the file has one (e.g. "AAPL", "BTC"). */
  symbol?: string;
  /** Nordnet only names stocks by ISIN; the server resolves it to a ticker. */
  isin?: string;
  name: string;
}

/** One transaction ready for the review table. */
export interface ImportedTransaction {
  broker: ImportBroker;
  /** The broker's own id for the row: re-importing the same id never duplicates it. */
  externalId: string;
  type: TransactionType;
  asset: ImportedAsset;
  /** Decimal strings with a dot, full precision. */
  quantity: string;
  /** Price and fee are in `currency`; the server converts them to USD before saving. */
  unitPrice: string;
  fee: string | null;
  /** ISO code: "USD", "EUR", "DKK"… (stablecoins such as USDC count as USD). */
  currency: string;
  /** ISO 8601 in UTC. */
  executedAt: string;
  /** 1-based line in the file, to point the user at the source. */
  line: number;
  /** Only the The Wire template carries these; otherwise the broker's name is used. */
  brokerName?: string;
  note?: string;
}

export type SkipReason =
  | "cash_movement" // deposits and withdrawals of cash (decision 106)
  | "zero_value" // e.g. voting rights handed out for free (decision 106)
  | "non_us" // stocks outside the US (decision 104)
  | "unsupported_currency"
  | "cancelled"
  | "failed" // a payment the broker reports as not completed
  | "transfer" // crypto sent or received between wallets: not a buy or sell
  | "fee_in_other_coin" // a trade fee paid in a third coin (e.g. BNB) we cannot value
  | "orphan_tax" // withholding tax whose dividend row is not in the file
  | "unsupported_type";

export interface SkippedRow {
  line: number;
  reason: SkipReason;
  /** What the user recognizes: the security name or the broker's row type. */
  label: string;
  /** YYYY-MM-DD when the row has one. */
  date?: string;
}

export type RowErrorCode = "invalid_number" | "invalid_date" | "missing_field" | "invalid_value";

export interface RowError {
  line: number;
  code: RowErrorCode;
  field: string;
}

export type ImportResult =
  /** no_prices: a known broker file that lacks prices (e.g. Binance's general history). */
  | { ok: false; error: "unrecognized_format" | "no_prices" }
  | {
      ok: true;
      broker: ImportBroker;
      transactions: ImportedTransaction[];
      skipped: SkippedRow[];
      errors: RowError[];
    };
