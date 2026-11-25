import { describe, expect, it } from "vitest";
import { readImportFile } from "@/lib/import";
import { exportFileName, transactionsCsv, type ExportRow } from "./csv";

const projects = new Map([
  ["p1", "Long term"],
  ["p2", "Trading, short"],
]);

function row(overrides: Partial<ExportRow>): ExportRow {
  return {
    projectId: "p1",
    type: "buy",
    quantity: "10",
    unitPrice: "95.5",
    fee: "1",
    executedAt: "2026-11-13T13:30:00Z",
    createdAt: "2026-11-13T13:31:00Z",
    broker: "Nordnet",
    note: null,
    asset: { symbol: "AAPL", assetClass: "stock" },
    ...overrides,
  };
}

const lines = (csv: string) => csv.replace(/^﻿/, "").trimEnd().split("\r\n");

describe("transactionsCsv", () => {
  it("writes the template's columns plus the project, oldest first, in the user's time zone", () => {
    const csv = transactionsCsv(
      [
        row({ executedAt: "2026-11-20T09:00:00Z", type: "sell", quantity: "4", unitPrice: "108", fee: "0.5" }),
        row({}),
      ],
      projects,
      "Europe/Copenhagen",
    );
    expect(csv.startsWith("﻿")).toBe(true);
    expect(lines(csv)).toEqual([
      "date,type,symbol,asset_type,quantity,price,fee,currency,broker,note,project",
      "2026-11-13 14:30,buy,AAPL,stock,10,95.5,1,USD,Nordnet,,Long term",
      "2026-11-20 10:00,sell,AAPL,stock,4,108,0.5,USD,Nordnet,,Long term",
    ]);
  });

  it("keeps exact decimals and includes cash movements", () => {
    const csv = transactionsCsv(
      [
        row({ quantity: "0.00012345", unitPrice: "91234.56789", fee: null, asset: { symbol: "BTC", assetClass: "crypto" } }),
        row({ type: "deposit", quantity: "500", unitPrice: "1", fee: null, asset: { symbol: "USD", assetClass: "cash" } }),
      ],
      projects,
      "UTC",
    );
    expect(lines(csv).slice(1)).toEqual([
      "2026-11-13 13:30,buy,BTC,crypto,0.00012345,91234.56789,,USD,Nordnet,,Long term",
      "2026-11-13 13:30,deposit,USD,cash,500,1,,USD,Nordnet,,Long term",
    ]);
  });

  it("quotes commas, quotes and line breaks, and defuses formulas", () => {
    const csv = transactionsCsv(
      [row({ projectId: "p2", note: 'Said "hold"\nthen sold', broker: "=HYPERLINK(1)" })],
      projects,
      "UTC",
    );
    expect(csv).toContain(`'=HYPERLINK(1),"Said ""hold""\nthen sold","Trading, short"`);
  });

  it("can be imported again with the same values", () => {
    const original = [
      row({}),
      row({
        type: "dividend",
        quantity: "10",
        unitPrice: "0.26",
        fee: "0.04",
        executedAt: "2026-11-15T12:00:00Z",
        note: "Q4, paid",
      }),
      row({ type: "reward", quantity: "0.0005", unitPrice: "0", fee: null, asset: { symbol: "ETH", assetClass: "crypto" } }),
    ];
    const csv = transactionsCsv(original, projects, "America/New_York");
    const result = readImportFile(
      new TextEncoder().encode(csv),
      "the-wire-transactions-2026-11-25.csv",
      "America/New_York",
    );
    if (!result.ok) throw new Error(`could not read the export back: ${result.error}`);
    expect(result.broker).toBe("thewire");
    expect(
      result.transactions.map((t) => [
        t.type,
        t.asset.symbol,
        t.quantity,
        t.unitPrice,
        t.fee,
        t.currency,
        t.executedAt,
        t.note ?? null,
      ]),
    ).toEqual([
      ["buy", "AAPL", "10", "95.5", "1", "USD", "2026-11-13T13:30:00.000Z", null],
      ["reward", "ETH", "0.0005", "0", null, "USD", "2026-11-13T13:30:00.000Z", null],
      ["dividend", "AAPL", "10", "0.26", "0.04", "USD", "2026-11-15T12:00:00.000Z", "Q4, paid"],
    ]);
  });
});

describe("exportFileName", () => {
  it("dates the file in the user's time zone", () => {
    const lateEvening = Date.parse("2026-11-25T23:30:00Z");
    expect(exportFileName(lateEvening, "UTC")).toBe("the-wire-transactions-2026-11-25.csv");
    expect(exportFileName(lateEvening, "Europe/Copenhagen")).toBe("the-wire-transactions-2026-11-26.csv");
  });
});
