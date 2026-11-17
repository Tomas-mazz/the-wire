import { describe, expect, it } from "vitest";
import { Dec, PortfolioError, computePosition } from "./index";
import { tx } from "./test-helpers";

const s = (d: Dec | null) => (d === null ? null : d.toString());

describe("computePosition", () => {
  it("returns an empty position for no transactions", () => {
    const p = computePosition([]);
    expect(s(p.quantity)).toBe("0");
    expect(s(p.costBasis)).toBe("0");
    expect(p.avgCost).toBeNull();
    expect(s(p.realized)).toBe("0");
    expect(s(p.income)).toBe("0");
  });

  it("adds the buy fee to the cost basis", () => {
    // 2 × 100 + 1 = 201 → avg 100.5
    const p = computePosition([tx("buy", "2", "100", { fee: "1" })]);
    expect(s(p.quantity)).toBe("2");
    expect(s(p.costBasis)).toBe("201");
    expect(s(p.avgCost)).toBe("100.5");
    expect(s(p.fees)).toBe("1");
  });

  it("weights the average cost by quantity", () => {
    // 1 × 100 + 3 × 200 = 700 over 4 units → 175
    const p = computePosition([
      tx("buy", "1", "100", { day: 1 }),
      tx("buy", "3", "200", { day: 2 }),
    ]);
    expect(s(p.avgCost)).toBe("175");
  });

  it("realizes P/L on a partial sell and keeps the average cost", () => {
    // realized = 1 × 300 − 2 − 1 × 175 = 123; cost 700 − 175 = 525
    const p = computePosition([
      tx("buy", "1", "100", { day: 1 }),
      tx("buy", "3", "200", { day: 2 }),
      tx("sell", "1", "300", { fee: "2", day: 3 }),
    ]);
    expect(s(p.quantity)).toBe("3");
    expect(s(p.costBasis)).toBe("525");
    expect(s(p.avgCost)).toBe("175");
    expect(s(p.realized)).toBe("123");
  });

  it("records a loss as negative realized P/L", () => {
    // 1 × 80 − 100 = −20
    const p = computePosition([
      tx("buy", "2", "100", { day: 1 }),
      tx("sell", "1", "80", { day: 2 }),
    ]);
    expect(s(p.realized)).toBe("-20");
  });

  it("leaves no rounding remainder after selling everything", () => {
    // cost 31 over 3 units: avg 10.333… never divides evenly.
    // Total realized must be exactly 3 × 12 − 31 = 5.
    const p = computePosition([
      tx("buy", "3", "10", { fee: "1", day: 1 }),
      tx("sell", "1", "12", { day: 2 }),
      tx("sell", "2", "12", { day: 3 }),
    ]);
    expect(s(p.quantity)).toBe("0");
    expect(s(p.costBasis)).toBe("0");
    expect(p.avgCost).toBeNull();
    expect(s(p.realized)).toBe("5");
  });

  it("starts a fresh average after the position was closed", () => {
    const p = computePosition([
      tx("buy", "1", "100", { day: 1 }),
      tx("sell", "1", "150", { day: 2 }),
      tx("buy", "2", "40", { day: 3 }),
    ]);
    expect(s(p.avgCost)).toBe("40");
    expect(s(p.realized)).toBe("50");
  });

  it("rejects selling more than is held", () => {
    const sell = tx("sell", "2.5", "100", { day: 2, id: "too-much" });
    const run = () => computePosition([tx("buy", "2", "100", { day: 1 }), sell]);
    expect(run).toThrow(PortfolioError);
    expect(run).toThrow(
      expect.objectContaining({ code: "sell_exceeds_quantity", transactionId: "too-much" }),
    );
  });

  it("rejects a sell dated before the buy", () => {
    expect(() =>
      computePosition([tx("buy", "1", "10", { day: 5 }), tx("sell", "1", "10", { day: 4 })]),
    ).toThrow(PortfolioError);
  });

  it("adds rewards at zero cost, lowering the average", () => {
    // 100 over 2 units → 50
    const p = computePosition([
      tx("buy", "1", "100", { day: 1 }),
      tx("reward", "1", "0", { day: 2 }),
    ]);
    expect(s(p.quantity)).toBe("2");
    expect(s(p.avgCost)).toBe("50");
  });

  it("adds a reward fee to the cost basis", () => {
    const p = computePosition([tx("reward", "0.5", "0", { fee: "0.25" })]);
    expect(s(p.costBasis)).toBe("0.25");
    expect(s(p.avgCost)).toBe("0.5");
  });

  it("counts gross dividends as income, without changing quantity", () => {
    // 10 shares × 0.25 = 2.5; the 0.3 withholding only goes to fees
    const p = computePosition([
      tx("buy", "10", "50", { day: 1 }),
      tx("dividend", "10", "0.25", { fee: "0.3", day: 2 }),
    ]);
    expect(s(p.quantity)).toBe("10");
    expect(s(p.costBasis)).toBe("500");
    expect(s(p.income)).toBe("2.5");
    expect(s(p.fees)).toBe("0.3");
  });

  it("ignores deposits and withdrawals", () => {
    const p = computePosition([
      tx("deposit", "1000", "1"),
      tx("withdrawal", "100", "1"),
    ]);
    expect(s(p.quantity)).toBe("0");
  });

  it("is exact where JS floats are not (0.1 + 0.2)", () => {
    const p = computePosition([tx("buy", "0.1", "1", { day: 1 }), tx("buy", "0.2", "1", { day: 2 })]);
    expect(s(p.quantity)).toBe("0.3");
    expect(s(p.costBasis)).toBe("0.3");
  });

  it("handles tiny crypto fractions", () => {
    const p = computePosition([tx("buy", "0.00000001", "95000.12")]);
    expect(s(p.costBasis)).toBe("0.0009500012");
  });

  it("orders by executedAt, not by array order", () => {
    const p = computePosition([
      tx("sell", "1", "150", { day: 2 }),
      tx("buy", "1", "100", { day: 1 }),
    ]);
    expect(s(p.realized)).toBe("50");
  });

  it("breaks executedAt ties with createdAt", () => {
    const sameDay = { day: 3 };
    const p = computePosition([
      tx("sell", "1", "150", { ...sameDay, createdAt: "2026-02-02T00:00:00Z" }),
      tx("buy", "1", "100", { ...sameDay, createdAt: "2026-02-01T00:00:00Z" }),
    ]);
    expect(s(p.realized)).toBe("50");
  });

  it.each([
    ["zero quantity", tx("buy", "0", "10")],
    ["negative quantity", tx("buy", "-1", "10")],
    ["negative price", tx("buy", "1", "-10")],
    ["negative fee", tx("buy", "1", "10", { fee: "-1" })],
    ["text that is not a number", tx("buy", "abc", "10")],
  ])("rejects %s", (_label, bad) => {
    expect(() => computePosition([bad])).toThrow(
      expect.objectContaining({ code: "invalid_amount" }),
    );
  });

  it("rejects an invalid date", () => {
    const bad = { ...tx("buy", "1", "10"), executedAt: "not a date" };
    expect(() => computePosition([bad, tx("buy", "1", "10")])).toThrow(
      expect.objectContaining({ code: "invalid_date" }),
    );
  });
});
