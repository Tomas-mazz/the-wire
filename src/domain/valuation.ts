import { Dec, ZERO, toDec, type DecimalInput } from "./decimal";
import type { Position } from "./position";

/** A position priced with its latest known price (or none). */
export interface ValuedPosition extends Position {
  lastPrice: Dec | null;
  /** quantity × lastPrice, or null without a price. */
  marketValue: Dec | null;
  /** marketValue − costBasis, or null without a price. */
  unrealized: Dec | null;
  /** unrealized / costBasis, or null without a price or with zero cost. */
  unrealizedPct: Dec | null;
  /** realized + income + unrealized, or null without a price. */
  totalPnl: Dec | null;
}

/**
 *   marketValue   = quantity × lastPrice
 *   unrealized    = marketValue − costBasis
 *   unrealizedPct = unrealized / costBasis   (as a fraction: 0.25 = 25 %)
 *   totalPnl      = realized + income + unrealized
 */
export function valuePosition(
  position: Position,
  lastPrice: DecimalInput | null,
): ValuedPosition {
  if (lastPrice === null || lastPrice === "") {
    return {
      ...position,
      lastPrice: null,
      marketValue: null,
      unrealized: null,
      unrealizedPct: null,
      totalPnl: null,
    };
  }
  const price = toDec(lastPrice);
  const marketValue = position.quantity.times(price);
  const unrealized = marketValue.minus(position.costBasis);
  return {
    ...position,
    lastPrice: price,
    marketValue,
    unrealized,
    unrealizedPct: position.costBasis.isZero() ? null : unrealized.div(position.costBasis),
    totalPnl: position.realized.plus(position.income).plus(unrealized),
  };
}

export interface PortfolioTotals {
  /** Sum of market values of priced positions. */
  marketValue: Dec;
  /** Sum of cost basis of priced positions. */
  costBasis: Dec;
  unrealized: Dec;
  /** unrealized / costBasis, or null when costBasis is zero. */
  unrealizedPct: Dec | null;
  /** From every position: sells and dividends do not need a live price. */
  realized: Dec;
  income: Dec;
  totalPnl: Dec;
  /** Open positions left out of value totals because they have no price. */
  missingPrice: number;
}

/**
 * Totals for a view (overview, crypto, stocks or one project).
 *
 * Open positions without a price are left out of marketValue, costBasis and
 * unrealized, and counted in `missingPrice` so the UI can show a note.
 * Realized P/L and income are known facts, so they always count.
 */
export function summarize(positions: readonly ValuedPosition[]): PortfolioTotals {
  let marketValue = ZERO;
  let costBasis = ZERO;
  let realized = ZERO;
  let income = ZERO;
  let missingPrice = 0;

  for (const p of positions) {
    realized = realized.plus(p.realized);
    income = income.plus(p.income);
    if (p.marketValue === null) {
      if (!p.quantity.isZero()) missingPrice += 1;
      continue;
    }
    marketValue = marketValue.plus(p.marketValue);
    costBasis = costBasis.plus(p.costBasis);
  }

  const unrealized = marketValue.minus(costBasis);
  return {
    marketValue,
    costBasis,
    unrealized,
    unrealizedPct: costBasis.isZero() ? null : unrealized.div(costBasis),
    realized,
    income,
    totalPnl: realized.plus(income).plus(unrealized),
    missingPrice,
  };
}

/**
 *   allocation = marketValue / total marketValue   (fraction, 0.4 = 40 %)
 *
 * Returns one entry per input, in the same order; null for positions
 * without a price, or for all of them when the total is zero.
 */
export function allocation(positions: readonly ValuedPosition[]): (Dec | null)[] {
  const total = positions.reduce(
    (sum, p) => (p.marketValue === null ? sum : sum.plus(p.marketValue)),
    ZERO,
  );
  return positions.map((p) =>
    p.marketValue === null || total.isZero() ? null : p.marketValue.div(total),
  );
}
