import { Dec, ZERO } from "./decimal";
import { parseTransaction, sortTransactions } from "./ledger";
import type { Transaction } from "./types";

export interface CashBalance {
  balance: Dec;
  /** True when the balance is below zero: the UI warns, it never blocks. */
  isNegative: boolean;
}

/**
 * Cash of a project that opted in to cash tracking. Takes ALL the
 * project's transactions (every asset). gross = quantity × unitPrice.
 *
 *   deposit:    + gross − fee
 *   withdrawal: − gross − fee
 *   buy:        − gross − fee
 *   sell:       + gross − fee
 *   dividend:   + gross − fee
 *   reward:     − fee   (the units themselves are free)
 */
export function computeCash(transactions: readonly Transaction[]): CashBalance {
  let balance = ZERO;

  for (const tx of sortTransactions(transactions)) {
    const { gross, fee } = parseTransaction(tx);
    switch (tx.type) {
      case "deposit":
      case "sell":
      case "dividend":
        balance = balance.plus(gross).minus(fee);
        break;
      case "withdrawal":
      case "buy":
        balance = balance.minus(gross).minus(fee);
        break;
      case "reward":
        balance = balance.minus(fee);
        break;
    }
  }

  return { balance, isNegative: balance.isNeg() && !balance.isZero() };
}
