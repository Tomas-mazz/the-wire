import { describe, expect, it } from "vitest";
import {
  parseDecimalInput,
  parseTransactionForm,
  utcToZonedLocal,
  zonedLocalToUtc,
} from "./parse";

describe("parseDecimalInput", () => {
  it.each([
    ["0.5", "0.5"],
    ["0,5", "0.5"],
    [" 12 ", "12"],
    ["95000.12", "95000.12"],
    ["0.00000001", "0.00000001"],
    [".25", "0.25"],
    ["3.", "3"],
    ["007", "7"],
    ["1.5", "1.5"],
    ["1500", "1500"],
    ["1.50", "1.50"],
    ["0.001", "0.001"],
    ["1234.567", "1234.567"],
  ])("reads %j as %j", (input, expected) => {
    expect(parseDecimalInput(input)).toEqual({ ok: true, value: expected });
  });

  it.each(["1.500", "2,750", "999.000"])("rejects %j as ambiguous", (input) => {
    expect(parseDecimalInput(input)).toEqual({ ok: false, error: "ambiguous_number" });
  });

  it.each(["abc", "1,000.50", "-1", "1e5", "1.2.3", "12%", "."])("rejects %j", (input) => {
    expect(parseDecimalInput(input)).toEqual({ ok: false, error: "invalid_number" });
  });

  it("requires a value", () => {
    expect(parseDecimalInput("  ")).toEqual({ ok: false, error: "required" });
    expect(parseDecimalInput(null)).toEqual({ ok: false, error: "required" });
  });
});

describe("time zones", () => {
  it("converts winter and summer time in Copenhagen", () => {
    expect(zonedLocalToUtc("2026-01-15T12:00", "Europe/Copenhagen")).toBe("2026-01-15T11:00:00.000Z");
    expect(zonedLocalToUtc("2026-07-01T12:00", "Europe/Copenhagen")).toBe("2026-07-01T10:00:00.000Z");
  });

  it("converts Buenos Aires (UTC−3)", () => {
    expect(zonedLocalToUtc("2026-01-02T22:30", "America/Argentina/Buenos_Aires")).toBe(
      "2026-01-03T01:30:00.000Z",
    );
  });

  it("round-trips to the input value", () => {
    const tz = "Europe/Copenhagen";
    for (const local of ["2026-03-29T01:30", "2026-10-25T12:00", "2026-12-31T23:59"]) {
      expect(utcToZonedLocal(zonedLocalToUtc(local, tz)!, tz)).toBe(local);
    }
  });

  it("rejects impossible dates and unknown zones", () => {
    expect(zonedLocalToUtc("2026-02-30T10:00", "UTC")).toBeNull();
    expect(zonedLocalToUtc("2026-01-01T25:00", "UTC")).toBeNull();
    expect(zonedLocalToUtc("2026-01-01T10:00", "Mars/Olympus")).toBeNull();
    expect(zonedLocalToUtc("yesterday", "UTC")).toBeNull();
  });
});

describe("parseTransactionForm", () => {
  const PROJECT = "11111111-1111-4111-8111-111111111111";
  const ASSET = "22222222-2222-4222-8222-222222222222";
  const NOW = Date.parse("2026-06-01T00:00:00Z");

  function form(fields: Record<string, string>) {
    const f = new FormData();
    const base = {
      projectId: PROJECT,
      type: "buy",
      assetMode: "existing",
      assetId: ASSET,
      executedAt: "2026-01-02T10:30",
      timeZone: "UTC",
      quantity: "0,5",
      unitPrice: "95000",
    };
    for (const [k, v] of Object.entries({ ...base, ...fields })) f.set(k, v);
    return f;
  }

  it("accepts a buy and normalizes numbers and the date", () => {
    const r = parseTransactionForm(form({ fee: "1,25", broker: " Nordnet " }), NOW);
    expect(r).toEqual({
      ok: true,
      value: {
        projectId: PROJECT,
        type: "buy",
        asset: { kind: "existing", assetId: ASSET },
        executedAt: "2026-01-02T10:30:00.000Z",
        quantity: "0.5",
        unitPrice: "95000",
        fee: "1.25",
        broker: "Nordnet",
        note: null,
      },
    });
  });

  it("uses the user's time zone for the date", () => {
    const r = parseTransactionForm(form({ timeZone: "Europe/Copenhagen" }), NOW);
    expect(r.ok && r.value.executedAt).toBe("2026-01-02T09:30:00.000Z");
  });

  it("creates a new asset with an upper-case symbol", () => {
    const r = parseTransactionForm(
      form({ assetMode: "new", symbol: "aapl", name: "Apple", assetClass: "stock" }),
      NOW,
    );
    expect(r.ok && r.value.asset).toEqual({
      kind: "new",
      symbol: "AAPL",
      name: "Apple",
      assetClass: "stock",
    });
  });

  it("forces USD cash and price 1 for deposits", () => {
    const r = parseTransactionForm(form({ type: "deposit", assetId: "", unitPrice: "" }), NOW);
    expect(r.ok && r.value.asset).toEqual({ kind: "cash" });
    expect(r.ok && r.value.unitPrice).toBe("1");
  });

  it("gives rewards a zero price", () => {
    const r = parseTransactionForm(form({ type: "reward", unitPrice: "" }), NOW);
    expect(r.ok && r.value.unitPrice).toBe("0");
  });

  it("reports every invalid field at once", () => {
    const r = parseTransactionForm(
      form({
        projectId: "nope",
        type: "split",
        quantity: "0",
        executedAt: "2026-12-01T10:00",
        fee: "-1",
      }),
      NOW,
    );
    expect(r).toEqual({
      ok: false,
      errors: {
        projectId: "invalid",
        type: "invalid",
        quantity: "must_be_positive",
        executedAt: "future_date",
        fee: "invalid_number",
      },
    });
  });

  it("requires an asset and a price for a buy", () => {
    const r = parseTransactionForm(form({ assetId: "", unitPrice: "" }), NOW);
    expect(r.ok ? null : r.errors).toEqual({ asset: "required", unitPrice: "required" });
  });

  it("validates the new asset fields", () => {
    const r = parseTransactionForm(
      form({ assetMode: "new", symbol: "BAD SYMBOL", name: "", assetClass: "bond" }),
      NOW,
    );
    expect(r.ok ? null : r.errors).toEqual({
      symbol: "invalid",
      name: "required",
      assetClass: "invalid",
    });
  });
});
