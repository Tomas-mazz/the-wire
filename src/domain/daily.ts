import { Dec, ZERO, toDec, type DecimalInput } from "./decimal";

/** One open position with today's price move (as the provider reports it). */
export interface DayMoveInput {
  quantity: Dec;
  /** Latest price, or null without one. */
  lastPrice: Dec | null;
  /** Change since the reference price, in percent (1.5 = +1.5 %), or null. */
  dayChangePct: DecimalInput | null;
}

export interface DayChange {
  /** Money gained or lost today by the positions that have a day change. */
  change: Dec;
  /** change / value at the reference price, or null when there is none. */
  changePct: Dec | null;
  /** How many positions were counted. */
  counted: number;
}

/**
 * Today's change of a group of positions (the "Today" card).
 *
 * Providers give each price's change in percent against a reference price
 * (the previous close for stocks, the price 24 h ago for crypto), so:
 *
 *   referencePrice = lastPrice / (1 + pct / 100)
 *   change         = quantity × (lastPrice − referencePrice)
 *   changePct      = Σ change / Σ (quantity × referencePrice)
 *
 * Positions without a price, without a day change or with nothing held are
 * skipped. The result is rounded only when it is displayed.
 */
export function dayChange(items: readonly DayMoveInput[]): DayChange {
  let change = ZERO;
  let reference = ZERO;
  let counted = 0;

  for (const item of items) {
    if (item.lastPrice === null || item.dayChangePct === null || item.quantity.isZero()) continue;
    const factor = toDec(item.dayChangePct).div(100).plus(1);
    if (factor.lte(0)) continue; // a −100 % move has no meaningful reference price
    const referencePrice = item.lastPrice.div(factor);
    change = change.plus(item.quantity.times(item.lastPrice.minus(referencePrice)));
    reference = reference.plus(item.quantity.times(referencePrice));
    counted += 1;
  }

  return { change, changePct: reference.isZero() ? null : change.div(reference), counted };
}

/** An item with today's move in percent (1.5 = +1.5 %). */
export interface DayMover<T> {
  item: T;
  dayChangePct: Dec;
}

/**
 * Best and worst move of the day among the items that have one (the
 * "Best and worst" card). With a single item, best and worst are the same.
 * Ties keep the first item in the input order.
 */
export function bestAndWorst<T>(
  items: readonly T[],
  pctOf: (item: T) => DecimalInput | null,
): { best: DayMover<T>; worst: DayMover<T> } | null {
  let best: DayMover<T> | null = null;
  let worst: DayMover<T> | null = null;

  for (const item of items) {
    const raw = pctOf(item);
    if (raw === null || raw === "") continue;
    const dayChangePct = toDec(raw);
    if (!best || dayChangePct.gt(best.dayChangePct)) best = { item, dayChangePct };
    if (!worst || dayChangePct.lt(worst.dayChangePct)) worst = { item, dayChangePct };
  }

  return best && worst ? { best, worst } : null;
}
