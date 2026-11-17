import { describe, expect, it } from "vitest";
import { Dec, allocation, computePosition, summarize, valuePosition } from "./index";
import { tx } from "./test-helpers";

const s = (d: Dec | null) => (d === null ? null : d.toString());

// 3 units, cost 525 (avg 175), realized 123 — see position.test.ts
const position = computePosition([
  tx("buy", "1", "100", { day: 1 }),
  tx("buy", "3", "200", { day: 2 }),
  tx("sell", "1", "300", { fee: "2", day: 3 }),
]);

describe("valuePosition", () => {
  it("computes market value, unrealized P/L, % and total P/L", () => {
    const v = valuePosition(position, "200");
    expect(s(v.marketValue)).toBe("600");
    expect(s(v.unrealized)).toBe("75");
    // 75 / 525 = 1/7
    expect(v.unrealizedPct!.toDecimalPlaces(6).toString()).toBe("0.142857");
    // 123 realized + 75 unrealized
    expect(s(v.totalPnl)).toBe("198");
  });

  it("shows a negative unrealized P/L when the price is below the average", () => {
    const v = valuePosition(position, "140");
    expect(s(v.unrealized)).toBe("-105");
    expect(s(v.unrealizedPct)).toBe("-0.2");
  });

  it("returns nulls when there is no price", () => {
    const v = valuePosition(position, null);
    expect(v.marketValue).toBeNull();
    expect(v.unrealized).toBeNull();
    expect(v.unrealizedPct).toBeNull();
    expect(v.totalPnl).toBeNull();
  });

  it("has no % when the cost basis is zero (rewards only)", () => {
    const v = valuePosition(computePosition([tx("reward", "2", "0")]), "10");
    expect(s(v.unrealized)).toBe("20");
    expect(v.unrealizedPct).toBeNull();
  });
});

describe("summarize", () => {
  const priced = valuePosition(position, "200"); // mv 600, cost 525
  const other = valuePosition(computePosition([tx("buy", "4", "100")]), "100"); // mv 400, cost 400
  const unpriced = valuePosition(computePosition([tx("buy", "1", "50")]), null);
  const closed = valuePosition(
    computePosition([tx("buy", "1", "10", { day: 1 }), tx("sell", "1", "15", { day: 2 })]),
    null,
  );

  it("adds priced positions and counts open positions without a price", () => {
    const t = summarize([priced, other, unpriced, closed]);
    expect(s(t.marketValue)).toBe("1000");
    expect(s(t.costBasis)).toBe("925");
    expect(s(t.unrealized)).toBe("75");
    // realized: 123 + 5 (closed position counts even without a price)
    expect(s(t.realized)).toBe("128");
    expect(s(t.totalPnl)).toBe("203");
    expect(t.missingPrice).toBe(1);
  });

  it("handles an empty view", () => {
    const t = summarize([]);
    expect(s(t.marketValue)).toBe("0");
    expect(t.unrealizedPct).toBeNull();
    expect(t.missingPrice).toBe(0);
  });
});

describe("allocation", () => {
  it("splits market value into fractions and skips unpriced positions", () => {
    const a = allocation([
      valuePosition(computePosition([tx("buy", "3", "100")]), "100"), // 300
      valuePosition(computePosition([tx("buy", "1", "100")]), "100"), // 100
      valuePosition(computePosition([tx("buy", "1", "100")]), null),
    ]);
    expect(a.map(s)).toEqual(["0.75", "0.25", null]);
  });

  it("returns nulls when the total is zero", () => {
    const a = allocation([valuePosition(computePosition([tx("buy", "1", "10")]), "0")]);
    expect(a).toEqual([null]);
  });
});
