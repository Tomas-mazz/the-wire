import type { ProviderId } from "@/market-data/types";

/** A price as the UI receives it: exact decimal text plus when it was last confirmed. */
export interface PriceSnapshot {
  assetId: string;
  price: string;
  dayChangePct: string | null;
  /** ISO time of the last successful update (UTC). */
  asOf: string;
  source: ProviderId;
}
