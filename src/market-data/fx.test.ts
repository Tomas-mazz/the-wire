import { describe, expect, it } from "vitest";
import { fetchUsdRates, parseFrankfurterRates } from "./fx";

describe("parseFrankfurterRates", () => {
  it("reads rates per USD as exact text", () => {
    expect(
      parseFrankfurterRates({ amount: 1, base: "USD", date: "2026-06-05", rates: { DKK: 6.4212, EUR: 0.85911 } }),
    ).toEqual({ date: "2026-06-05", rates: { DKK: "6.4212", EUR: "0.85911" } });
  });

  it("rejects other bases and drops bad values", () => {
    expect(parseFrankfurterRates({ base: "EUR", date: "2026-06-05", rates: {} })).toBeNull();
    expect(parseFrankfurterRates({ base: "USD", date: "2026-06-05", rates: { DKK: "x", EUR: 0 } })?.rates).toEqual({});
  });
});

describe("fetchUsdRates", () => {
  it("asks for the day and currencies, never USD itself", async () => {
    let asked = "";
    const fake = async (url: string) => {
      asked = url;
      return new Response(JSON.stringify({ amount: 1, base: "USD", date: "2026-06-01", rates: { DKK: 6.4 } }));
    };
    await expect(fetchUsdRates("2026-06-01", ["DKK", "USD"], fake)).resolves.toEqual({
      date: "2026-06-01",
      rates: { DKK: "6.4" },
    });
    expect(asked).toBe("https://api.frankfurter.dev/v1/2026-06-01?base=USD&symbols=DKK");
  });

  it("throws when the service fails", async () => {
    const fake = async () => new Response("down", { status: 503 });
    await expect(fetchUsdRates("2026-06-01", ["DKK"], fake)).rejects.toThrow(/503/);
  });
});
