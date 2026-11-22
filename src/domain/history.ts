import { ZERO, toDec, type Dec, type DecimalInput } from "./decimal";
import type { LedgerTransaction } from "./holdings";
import { sortTransactions } from "./ledger";

/** A closing price on a UTC calendar day ("2026-11-20"). */
export interface DailyClose {
  day: string;
  close: DecimalInput;
}

/** The value of a group of holdings at the end of one day. */
export interface ValuePoint {
  day: string;
  /** Σ quantity held × last known close. */
  value: Dec;
  /**
   * Money that came in that day: buys (q × price + fee) and reward fees,
   * minus what came out: sells and dividends (q × price − fee).
   */
  flow: Dec;
  /** Assets held that day without any close yet (left out of `value`). */
  missing: string[];
}

export interface PeriodChange {
  /** Gain or loss over the period, without the money added or taken out. */
  change: Dec;
  /** change / (start value + money added), or null when that is zero. */
  changePct: Dec | null;
}

/** The UTC day of an ISO timestamp ("2026-11-20T23:30:00Z" → "2026-11-20"). */
export function utcDay(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/** Every UTC day from `from` to `to`, both included. */
export function dayRange(from: string, to: string): string[] {
  const days: string[] = [];
  const end = Date.parse(`${to}T00:00:00Z`);
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= end; t += 86_400_000) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

/** Signed money flow of one transaction (see ValuePoint.flow). */
function flowOf(tx: LedgerTransaction): Dec {
  const gross = toDec(tx.quantity).times(toDec(tx.unitPrice));
  const fee = toDec(tx.fee ?? null);
  switch (tx.type) {
    case "buy":
      return gross.plus(fee);
    case "reward":
      return fee;
    case "sell":
    case "dividend":
      return gross.minus(fee).negated();
    default:
      return ZERO; // cash deposits and withdrawals are not part of these series
  }
}

/** Quantity change of one transaction (dividends and cash don't change it). */
function quantityOf(tx: LedgerTransaction): Dec {
  if (tx.type === "buy" || tx.type === "reward") return toDec(tx.quantity);
  if (tx.type === "sell") return toDec(tx.quantity).negated();
  return ZERO;
}

/**
 * Value of the holdings at the end of each day in `days` (ascending):
 *
 *   value(d) = Σ over assets  quantity held at the end of d × close(d)
 *
 * where close(d) is the asset's last close on or before d, so stocks keep
 * Friday's close over the weekend. Transactions count on the UTC day they
 * happened; those before the first day are folded into it. `closes` must be
 * sorted by day for each asset id.
 */
export function valueSeries(
  transactions: readonly LedgerTransaction[],
  closes: ReadonlyMap<string, readonly DailyClose[]>,
  days: readonly string[],
): ValuePoint[] {
  const sorted = sortTransactions(transactions) as LedgerTransaction[]; // same objects, reordered
  const quantities = new Map<string, Dec>();
  const cursor = new Map<string, number>(); // index of the next close to look at
  const lastClose = new Map<string, Dec>();
  let next = 0;
  const points: ValuePoint[] = [];

  for (const day of days) {
    let flow = ZERO;
    while (next < sorted.length && utcDay(sorted[next].executedAt) <= day) {
      const tx = sorted[next++];
      quantities.set(tx.assetId, (quantities.get(tx.assetId) ?? ZERO).plus(quantityOf(tx)));
      flow = flow.plus(flowOf(tx));
    }

    let value = ZERO;
    const missing: string[] = [];
    for (const [assetId, quantity] of quantities) {
      const list = closes.get(assetId) ?? [];
      let i = cursor.get(assetId) ?? 0;
      while (i < list.length && list[i].day <= day) lastClose.set(assetId, toDec(list[i++].close));
      cursor.set(assetId, i);

      if (quantity.isZero()) continue;
      const close = lastClose.get(assetId);
      if (close === undefined) missing.push(assetId);
      else value = value.plus(quantity.times(close));
    }
    points.push({ day, value, flow, missing });
  }
  return points;
}

/**
 * Gain over a period of a value series, without the money put in or taken
 * out (decision 114):
 *
 *   change    = value(end) − value(start) − Σ flow of the days after start
 *   changePct = change / (value(start) + Σ positive flows after start)
 *
 * Buying $2,000 more in a month the market fell 5 % shows a loss, not a gain.
 * The percent is a simple approximation: it does not weigh money by how long
 * it was invested.
 */
export function periodChange(points: readonly { value: Dec; flow: Dec }[]): PeriodChange {
  if (points.length < 2) return { change: ZERO, changePct: null };
  let net = ZERO;
  let added = ZERO;
  for (const p of points.slice(1)) {
    net = net.plus(p.flow);
    if (p.flow.isPositive()) added = added.plus(p.flow);
  }
  const start = points[0].value;
  const change = points[points.length - 1].value.minus(start).minus(net);
  const base = start.plus(added);
  return { change, changePct: base.isZero() ? null : change.div(base) };
}

/** Change of a price between the first and last close: (last − first) / first. */
export function priceChange(closes: readonly { close: Dec }[]): PeriodChange {
  if (closes.length < 2) return { change: ZERO, changePct: null };
  const first = closes[0].close;
  const change = closes[closes.length - 1].close.minus(first);
  return { change, changePct: first.isZero() ? null : change.div(first) };
}
