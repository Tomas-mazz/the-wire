import { Dec, ZERO, toDec, type DecimalInput, type TransactionType } from "@/domain";

export interface TotalInput {
  type: TransactionType;
  quantity: DecimalInput;
  unitPrice: DecimalInput;
  fee?: DecimalInput | null;
}

/**
 * Money that actually moved for one transaction, fees included (decision 107):
 *   buy                   = quantity × unit price + fee   (what you paid)
 *   sell / dividend       = quantity × unit price − fee   (what you received)
 *   deposit / withdrawal  = quantity (dollars)
 *   reward                = nothing (it is free)
 */
export function transactionTotal(row: TotalInput): Dec | null {
  if (row.type === "reward") return null;
  if (row.type === "deposit" || row.type === "withdrawal") return toDec(row.quantity);
  const gross = toDec(row.quantity).times(toDec(row.unitPrice));
  const fee = row.fee == null || row.fee === "" ? ZERO : toDec(row.fee);
  return row.type === "buy" ? gross.plus(fee) : gross.minus(fee);
}
