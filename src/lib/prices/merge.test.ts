import { describe, expect, it } from "vitest";
import { withManualPrices } from "./merge";
import type { PriceSnapshot } from "./types";

const snap = (assetId: string, price: string, source: PriceSnapshot["source"]): PriceSnapshot => ({
  assetId,
  price,
  dayChangePct: null,
  asOf: "2026-11-17T12:00:00.000Z",
  source,
});

describe("withManualPrices", () => {
  it("uses a manual price only where no provider has one", () => {
    const merged = withManualPrices(
      [snap("btc", "65000", "binance")],
      [snap("btc", "1", "manual"), snap("local", "12.5", "manual")],
    );
    expect(merged.map((p) => [p.assetId, p.price, p.source])).toEqual([
      ["btc", "65000", "binance"],
      ["local", "12.5", "manual"],
    ]);
  });

  it("returns provider prices unchanged without manual ones", () => {
    expect(withManualPrices([snap("a", "1", "finnhub")], [])).toHaveLength(1);
  });
});
