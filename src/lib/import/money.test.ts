import { describe, expect, it } from "vitest";
import { Dec } from "@/domain";
import { dateTimeAtOffset, moneyCurrency, plainDecimal, ratio, splitAmount } from "./money";

describe("money helpers", () => {
  it("treats dollar stablecoins as USD and knows fiat from coins", () => {
    expect(moneyCurrency("USDC")).toBe("USD");
    expect(moneyCurrency("eur")).toBe("EUR");
    expect(moneyCurrency("BTC")).toBeNull();
  });

  it("reads plain decimals, including exponents", () => {
    expect(plainDecimal("0.0289")?.toFixed()).toBe("0.0289");
    expect(plainDecimal("1.79779E-5")?.toFixed()).toBe("0.0000179779");
    expect(plainDecimal("1,5")).toBeNull();
  });

  it("splits an amount from its coin, with or without a space", () => {
    expect(splitAmount("196.00 EUR")).toEqual({ amount: new Dec("196"), code: "EUR" });
    expect(splitAmount("87.195924USDC")?.code).toBe("USDC");
    expect(splitAmount("abc")).toBeNull();
  });

  it("divides to 10 decimals without exponents", () => {
    expect(ratio(new Dec(1), new Dec(3))).toBe("0.3333333333");
  });

  it("reads a wall-clock time at a fixed offset", () => {
    expect(dateTimeAtOffset("2026-06-01 18:49:23", 60)).toBe("2026-06-01T17:49:23.000Z");
    expect(dateTimeAtOffset("2026-02-30 10:00:00", 0)).toBeNull();
  });
});
