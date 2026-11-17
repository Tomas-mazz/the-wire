import { Dec, ZERO } from "./decimal";
import { parseTransaction, sortTransactions } from "./ledger";
import { PortfolioError, type Transaction } from "./types";

/** State of one asset inside one project after replaying its ledger. */
export interface Position {
  quantity: Dec;
  /** Money still invested in the units held (includes buy fees). */
  costBasis: Dec;
  /** costBasis / quantity, or null when nothing is held. */
  avgCost: Dec | null;
  /** Profit or loss already locked in by sells. */
  realized: Dec;
  /** Gross dividends (decision 75); their fees are in `fees`. */
  income: Dec;
  /** All fees paid on this asset. */
  fees: Dec;
}

/**
 * Replays the transactions of ONE asset in ONE project with the
 * weighted average cost method (decision 60 in QUESTIONS.md).
 *
 *   buy:      quantity += q
 *             costBasis += q × price + fee
 *   sell:     realized += q × price − fee − q × avgCost
 *             costBasis −= q × avgCost      (avgCost stays the same)
 *             quantity -= q                 (selling more than held throws)
 *   reward:   quantity += q at zero cost (lowers avgCost); the fee is
 *             optional and, when entered, is added to costBasis
 *   dividend: income += q × price          (gross: q = shares, price = per
 *             share); a fee or withholding only counts in `fees`
 *
 *   avgCost = costBasis / quantity
 *
 * deposit / withdrawal only move cash (see cash.ts) and are ignored here.
 */
export function computePosition(transactions: readonly Transaction[]): Position {
  let quantity = ZERO;
  let costBasis = ZERO;
  let realized = ZERO;
  let income = ZERO;
  let fees = ZERO;

  for (const tx of sortTransactions(transactions)) {
    const { quantity: q, fee, gross } = parseTransaction(tx);

    switch (tx.type) {
      case "buy":
        quantity = quantity.plus(q);
        costBasis = costBasis.plus(gross).plus(fee);
        fees = fees.plus(fee);
        break;

      case "sell": {
        if (q.gt(quantity)) {
          throw new PortfolioError(
            "sell_exceeds_quantity",
            tx.id,
            `Cannot sell ${q.toString()} when only ${quantity.toString()} is held`,
          );
        }
        // Selling everything removes the whole cost basis, so no rounding
        // remainder from the division is ever left behind.
        const costOfSold = q.eq(quantity)
          ? costBasis
          : q.times(costBasis.div(quantity));
        realized = realized.plus(gross).minus(fee).minus(costOfSold);
        costBasis = costBasis.minus(costOfSold);
        quantity = quantity.minus(q);
        fees = fees.plus(fee);
        break;
      }

      case "reward":
        quantity = quantity.plus(q);
        costBasis = costBasis.plus(fee);
        fees = fees.plus(fee);
        break;

      case "dividend":
        income = income.plus(gross);
        fees = fees.plus(fee);
        break;

      case "deposit":
      case "withdrawal":
        break;
    }
  }

  return {
    quantity,
    costBasis,
    avgCost: quantity.isZero() ? null : costBasis.div(quantity),
    realized,
    income,
    fees,
  };
}
