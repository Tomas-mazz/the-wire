import type { Transaction, TransactionType } from "./types";

let counter = 0;

/** Builds a transaction for tests. `day` sets executedAt to 2026-01-<day>. */
export function tx(
  type: TransactionType,
  quantity: string,
  unitPrice: string,
  options: { fee?: string; day?: number; createdAt?: string; id?: string } = {},
): Transaction {
  counter += 1;
  const day = String(options.day ?? 1).padStart(2, "0");
  return {
    id: options.id ?? `t${String(counter).padStart(4, "0")}`,
    type,
    quantity,
    unitPrice,
    fee: options.fee ?? null,
    executedAt: `2026-01-${day}T12:00:00Z`,
    createdAt: options.createdAt ?? "2026-02-01T00:00:00Z",
  };
}
