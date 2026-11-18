import { describe, expect, it } from "vitest";
import { toDec } from "@/domain";
import { buildSummary, dayFraction, type SummaryInput } from "./summary";

const base: SummaryInput = {
  title: "My portfolio",
  date: "Nov 18, 2026",
  lines: [
    { label: "Total", pct: toDec("0.145"), amount: toDec("6120.4") },
    { label: "Today", pct: toDec("0.0171"), amount: toDec("812.05") },
  ],
  items: [
    { symbol: "BTC", pct: toDec("0.223"), amount: toDec("3950") },
    { symbol: "NVDA", pct: toDec("0.31"), amount: toDec("340") },
    { symbol: "TSLA", pct: toDec("-0.082"), amount: toDec("-210.6") },
    { symbol: "XYZ", pct: null, amount: null },
  ],
  withAmounts: true,
  locale: "en-US",
  footer: "The Wire",
};

describe("buildSummary", () => {
  it("lists every priced holding with arrows, % and whole dollars", () => {
    expect(buildSummary(base)).toBe(
      [
        "📊 My portfolio · Nov 18, 2026",
        "Total: +14.5% (+$6,120)",
        "Today: +1.7% (+$812)",
        "",
        "▲ BTC   +22.3% (+$3,950)",
        "▲ NVDA  +31.0% (+$340)",
        "▼ TSLA  −8.2% (−$211)",
        "",
        "— The Wire",
      ].join("\n"),
    );
  });

  it("drops every amount with 'only %'", () => {
    const text = buildSummary({ ...base, withAmounts: false });
    expect(text).not.toContain("$");
    expect(text).toContain("Total: +14.5%\nToday: +1.7%\n▲ BTC +22.3% · ▲ NVDA +31.0% · ▼ TSLA −8.2%");
  });

  it("keeps cents for small amounts and skips unknown lines", () => {
    const text = buildSummary({
      ...base,
      lines: [
        { label: "Total", pct: toDec("0.05"), amount: toDec("12.345") },
        { label: "Today", pct: null, amount: null },
      ],
      items: [],
    });
    expect(text).toBe("📊 My portfolio · Nov 18, 2026\nTotal: +5.0% (+$12.35)\n\n— The Wire");
  });

  it("formats numbers in the user's language", () => {
    const text = buildSummary({ ...base, locale: "es-AR", items: [] });
    // Decimal comma and dot for thousands, as Intl formats them for Spanish.
    expect(text).toContain("Total: +14,5");
    expect(text).toContain("6.120");
  });
});

describe("dayFraction", () => {
  it("turns a provider's percent into a fraction", () => {
    expect(dayFraction("1.5")!.toString()).toBe("0.015");
    expect(dayFraction(null)).toBeNull();
  });
});
