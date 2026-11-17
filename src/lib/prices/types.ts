import type { ProviderId } from "@/market-data/types";

/** Where a price came from: a provider, or the user's own manual price. */
export type PriceSource = ProviderId | "manual";

/** A price as the UI receives it: exact decimal text plus when it was last confirmed. */
export interface PriceSnapshot {
  assetId: string;
  price: string;
  dayChangePct: string | null;
  /** ISO time (UTC): last successful provider update, or when the manual price was set. */
  asOf: string;
  source: PriceSource;
}
