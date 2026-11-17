import type { PriceSnapshot } from "./types";

/**
 * Manual prices fill the gaps only (decision 91): an asset with a provider
 * price keeps it, even if the user once typed one; an asset without a
 * provider price uses the user's manual price, if any.
 */
export function withManualPrices(
  providerPrices: readonly PriceSnapshot[],
  manualPrices: readonly PriceSnapshot[],
): PriceSnapshot[] {
  const priced = new Set(providerPrices.map((p) => p.assetId));
  return [...providerPrices, ...manualPrices.filter((m) => !priced.has(m.assetId))];
}
