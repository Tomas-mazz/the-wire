import { describe, expect, it } from "vitest";
import { computeHoldings, type LedgerTransaction } from "./index";
import { tx } from "./test-helpers";

function ltx(projectId: string, assetId: string, ...args: Parameters<typeof tx>): LedgerTransaction {
  return { ...tx(...args), projectId, assetId };
}

describe("computeHoldings", () => {
  it("sums the same asset across projects with a weighted average", () => {
    // P1: 1 BTC for 100 · P2: 3 BTC for 600 → 4 BTC, cost 700, avg 175
    const { holdings, problems } = computeHoldings([
      ltx("p1", "btc", "buy", "1", "100"),
      ltx("p2", "btc", "buy", "3", "200"),
    ]);
    expect(problems).toEqual([]);
    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity.toString()).toBe("4");
    expect(holdings[0].costBasis.toString()).toBe("700");
    expect(holdings[0].avgCost!.toString()).toBe("175");
  });

  it("keeps the average cost per project when selling", () => {
    // P1 avg 100, P2 avg 200. Selling 1 in P2 at 300 realizes 100 (not 125).
    const { holdings } = computeHoldings([
      ltx("p1", "btc", "buy", "1", "100", { day: 1 }),
      ltx("p2", "btc", "buy", "2", "200", { day: 1 }),
      ltx("p2", "btc", "sell", "1", "300", { day: 2 }),
    ]);
    expect(holdings[0].realized.toString()).toBe("100");
    expect(holdings[0].quantity.toString()).toBe("2");
    expect(holdings[0].costBasis.toString()).toBe("300");
  });

  it("separates assets", () => {
    const { holdings } = computeHoldings([
      ltx("p1", "btc", "buy", "1", "100"),
      ltx("p1", "eth", "buy", "2", "10"),
    ]);
    expect(holdings.map((h) => h.assetId).sort()).toEqual(["btc", "eth"]);
  });

  it("reports a broken ledger without hiding the others", () => {
    const { holdings, problems } = computeHoldings([
      ltx("p1", "btc", "sell", "1", "100"),
      ltx("p1", "eth", "buy", "2", "10"),
    ]);
    expect(holdings.map((h) => h.assetId)).toEqual(["eth"]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({ projectId: "p1", assetId: "btc" });
    expect(problems[0].error.code).toBe("sell_exceeds_quantity");
  });
});
