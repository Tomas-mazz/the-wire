import Decimal from "decimal.js";

/**
 * Decimal constructor used by all portfolio math.
 *
 * A private clone so the global decimal.js settings are never changed.
 * 40 significant digits keeps divisions (e.g. average cost) exact enough
 * for any realistic quantity or price; rounding happens only for display.
 */
export const Dec = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export type Dec = InstanceType<typeof Dec>;

/** A number as text ("0.1") or a Decimal. Never a JS float. */
export type DecimalInput = string | Dec;

export const ZERO = new Dec(0);

export function toDec(value: DecimalInput | null | undefined): Dec {
  if (value === null || value === undefined || value === "") return ZERO;
  return new Dec(value);
}
