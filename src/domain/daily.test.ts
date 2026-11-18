import { describe, expect, it } from "vitest";
import { bestAndWorst, dayChange, toDec } from "./index";

const d = toDec;

describe("dayChange", () => {
  it("turns each price's % move into money and a combined %", () => {
    // 2 × 110 after +10 % (reference 100) → +20
    // 1 × 95 after −5 % (reference 100) → −5
    const result = dayChange([
      { quantity: d("2"), lastPrice: d("110"), dayChangePct: "10" },
      { quantity: d("1"), lastPrice: d("95"), dayChangePct: "-5" },
    ]);
    expect(result.change.toString()).toBe("15");
    // 15 / (200 + 100)
    expect(result.changePct!.toString()).toBe("0.05");
    expect(result.counted).toBe(2);
  });

  it("skips positions without a price, without a move or already sold", () => {
    const result = dayChange([
      { quantity: d("1"), lastPrice: null, dayChangePct: "3" },
      { quantity: d("1"), lastPrice: d("50"), dayChangePct: null },
      { quantity: d("0"), lastPrice: d("50"), dayChangePct: "3" },
    ]);
    expect(result.change.toString()).toBe("0");
    expect(result.changePct).toBeNull();
    expect(result.counted).toBe(0);
  });

  it("keeps fractional crypto quantities exact", () => {
    // 0.5 BTC at 60,000 after +20 % → reference 50,000 → +5,000
    const result = dayChange([{ quantity: d("0.5"), lastPrice: d("60000"), dayChangePct: "20" }]);
    expect(result.change.toString()).toBe("5000");
    expect(result.changePct!.toString()).toBe("0.2");
  });

  it("ignores a −100 % move, which has no reference price", () => {
    const result = dayChange([{ quantity: d("1"), lastPrice: d("0"), dayChangePct: "-100" }]);
    expect(result.counted).toBe(0);
  });
});

describe("bestAndWorst", () => {
  const items = [
    { symbol: "AAPL", pct: "1.2" },
    { symbol: "TSLA", pct: "-3.4" },
    { symbol: "NVDA", pct: "4.1" },
    { symbol: "MSFT", pct: null },
  ];

  it("finds the biggest gain and the biggest loss", () => {
    const result = bestAndWorst(items, (i) => i.pct)!;
    expect(result.best.item.symbol).toBe("NVDA");
    expect(result.best.dayChangePct.toString()).toBe("4.1");
    expect(result.worst.item.symbol).toBe("TSLA");
  });

  it("returns the same item for best and worst when only one has a move", () => {
    const result = bestAndWorst([items[0], items[3]], (i) => i.pct)!;
    expect(result.best.item.symbol).toBe("AAPL");
    expect(result.worst.item.symbol).toBe("AAPL");
  });

  it("returns null when nothing has a move", () => {
    expect(bestAndWorst([items[3]], (i) => i.pct)).toBeNull();
    expect(bestAndWorst([], () => "1")).toBeNull();
  });
});
