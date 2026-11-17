import { describe, expect, it } from "vitest";
import { computeCash } from "./index";
import { tx } from "./test-helpers";

describe("computeCash", () => {
  it("starts at zero", () => {
    const c = computeCash([]);
    expect(c.balance.toString()).toBe("0");
    expect(c.isNegative).toBe(false);
  });

  it("applies every transaction type with its fee", () => {
    const c = computeCash([
      tx("deposit", "1000", "1", { day: 1 }), // 1000
      tx("buy", "2", "100", { fee: "1", day: 2 }), // − 201 → 799
      tx("sell", "1", "150", { fee: "1", day: 3 }), // + 149 → 948
      tx("dividend", "1", "2", { day: 4 }), // + 2 → 950
      tx("reward", "1", "0", { fee: "0.5", day: 5 }), // − 0.5 → 949.5
      tx("withdrawal", "49", "1", { fee: "0.5", day: 6 }), // − 49.5 → 900
    ]);
    expect(c.balance.toString()).toBe("900");
    expect(c.isNegative).toBe(false);
  });

  it("flags a negative balance instead of blocking", () => {
    const c = computeCash([tx("buy", "1", "100")]);
    expect(c.balance.toString()).toBe("-100");
    expect(c.isNegative).toBe(true);
  });
});
