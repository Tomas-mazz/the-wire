import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readImportFile, TEMPLATE_HEADERS } from "./index";
import { parseTemplate } from "./template";

const HEAD = TEMPLATE_HEADERS.join(",");

function parsed(text: string, tz = "Europe/Copenhagen") {
  const result = parseTemplate(text, tz);
  if (!result?.ok) throw new Error("expected a template");
  return result;
}

describe("parseTemplate", () => {
  it("reads a full row, keeping the original currency, broker and note", () => {
    const result = parsed(`${HEAD}\n2026-11-13 14:30,buy,btc,crypto,0.01,69433.07,24.83,USD,Coinbase,For my brother\n`);
    expect(result.transactions).toEqual([
      {
        broker: "thewire",
        externalId: expect.stringMatching(/^[0-9a-z]+-1$/),
        line: 2,
        type: "buy",
        asset: { kind: "crypto", symbol: "BTC", name: "BTC" },
        quantity: "0.01",
        unitPrice: "69433.07",
        fee: "24.83",
        currency: "USD",
        executedAt: "2026-11-13T13:30:00.000Z", // 14:30 in Copenhagen (UTC+1 in November)
        brokerName: "Coinbase",
        note: "For my brother",
      },
    ]);
  });

  it("accepts a date without time, Spanish types, semicolons and decimal commas", () => {
    const text = "date;type;symbol;asset_type;quantity;price;fee\n2026-04-07;compra;AAPL;stock;1;161,56;\n";
    expect(parsed(text).transactions[0]).toEqual(
      expect.objectContaining({
        type: "buy",
        unitPrice: "161.56",
        fee: null,
        currency: "USD",
        executedAt: "2026-04-07T12:00:00.000Z",
      }),
    );
  });

  it("gives the same row the same key every time, and tells identical rows apart", () => {
    const row = "2026-01-02,buy,AAPL,stock,1,100,,USD,,";
    const first = parsed(`${HEAD}\n${row}\n${row}\n`).transactions.map((t) => t.externalId);
    const again = parsed(`${HEAD}\n${row}\n`).transactions.map((t) => t.externalId);
    expect(first[0]).not.toBe(first[1]);
    expect(again[0]).toBe(first[0]);
  });

  it("reports each bad cell and keeps the good rows", () => {
    const text = [
      HEAD,
      "2026-01-02,swap,AAPL,stock,1,100,,,,",
      "02/01/2026,buy,AAPL,stock,1,100,,,,",
      "2026-01-02,buy,AAPL,bond,1,100,,,,",
      "2026-01-02,buy,AAPL,stock,0,100,,,,",
      '2026-01-02,buy,AAPL,stock,1,"1,500",,,,',
      "2026-01-02,buy,AAPL,stock,1,100,,XYZ,,",
      "2026-01-02,buy,AAPL,stock,1,100,,,,",
    ].join("\n");
    const result = parsed(text);
    expect(result.errors).toEqual([
      { line: 2, code: "invalid_value", field: "type" },
      { line: 3, code: "invalid_date", field: "date" },
      { line: 4, code: "invalid_value", field: "asset_type" },
      { line: 5, code: "invalid_number", field: "quantity" },
      { line: 6, code: "invalid_number", field: "price" },
      { line: 7, code: "invalid_value", field: "currency" },
    ]);
    expect(result.transactions).toHaveLength(1);
  });

  it("returns null for other files", () => {
    expect(parseTemplate("a,b\n1,2", "UTC")).toBeNull();
  });

  it("matches the downloadable empty template", () => {
    const file = readFileSync("public/the-wire-template.csv", "utf8");
    expect(file.trim()).toBe(HEAD);
    expect(parsed(file).transactions).toEqual([]);
  });
});

describe("readImportFile", () => {
  const bytes = (text: string) => new Uint8Array(Buffer.from(text));

  it("sends each file to the right reader", () => {
    const template = readImportFile(bytes(`${HEAD}\n2026-01-02,buy,AAPL,stock,1,100,,,,\n`), "mine.csv", "UTC");
    expect(template.ok && template.broker).toBe("thewire");

    const binance = readImportFile(
      bytes("Time,Method,Spend Amount,Receive Amount,Fee,Price,Status,Transaction ID\n"),
      "Binance-Fiat-Buy-History(UTC+1).csv",
      "UTC",
    );
    expect(binance.ok && binance.broker).toBe("binance");
  });

  it("recognizes PDFs and images and says they can't be read yet", () => {
    const pdf = new Uint8Array(Buffer.from("%PDF-1.7\n%âãÏÓ\n1 0 obj"));
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const heic = new Uint8Array(Buffer.from("\0\0\0\x18ftypheic"));
    for (const file of [pdf, png, jpeg, heic]) {
      expect(readImportFile(file, "statement", "UTC")).toEqual({ ok: false, error: "unsupported_file" });
    }
  });

  it("says when it doesn't know the file", () => {
    expect(readImportFile(bytes("hello,world\n1,2"), "x.csv", "UTC")).toEqual({
      ok: false,
      error: "unrecognized_format",
    });
  });
});
