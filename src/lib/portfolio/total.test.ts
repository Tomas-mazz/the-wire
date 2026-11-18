import { describe, expect, it } from "vitest";
import { transactionTotal } from "./total";

const total = (row: Parameters<typeof transactionTotal>[0]) => transactionTotal(row)?.toString() ?? null;

describe("transactionTotal", () => {
  it("adds the fee to a buy (what you paid)", () => {
    expect(total({ type: "buy", quantity: "0.5", unitPrice: "100", fee: "2.5" })).toBe("52.5");
  });

  it("subtracts the fee from a sell (what you received)", () => {
    expect(total({ type: "sell", quantity: "2", unitPrice: "10", fee: "1" })).toBe("19");
  });

  it("subtracts withholding tax from a dividend", () => {
    expect(total({ type: "dividend", quantity: "1", unitPrice: "0.27", fee: "0.04" })).toBe("0.23");
  });

  it("treats a missing or empty fee as zero", () => {
    expect(total({ type: "buy", quantity: "3", unitPrice: "1.5" })).toBe("4.5");
    expect(total({ type: "buy", quantity: "3", unitPrice: "1.5", fee: null })).toBe("4.5");
    expect(total({ type: "buy", quantity: "3", unitPrice: "1.5", fee: "" })).toBe("4.5");
  });

  it("shows deposits and withdrawals as their dollar amount", () => {
    expect(total({ type: "deposit", quantity: "250", unitPrice: "1", fee: "1" })).toBe("250");
    expect(total({ type: "withdrawal", quantity: "80", unitPrice: "1" })).toBe("80");
  });

  it("has no total for a reward", () => {
    expect(total({ type: "reward", quantity: "0.01", unitPrice: "0", fee: "0.1" })).toBeNull();
  });

  it("keeps full precision (no floats)", () => {
    expect(total({ type: "buy", quantity: "0.1", unitPrice: "0.2", fee: "0.3" })).toBe("0.32");
  });
});
