import { describe, expect, it } from "vitest";
import { computePosition } from "@/domain";
import { decodeText } from "./delimited";
import { parseNordnet } from "./nordnet";

// Same 30 columns, order and quirks as a real Nordnet export; all values are made up.
const HEADER = [
  "Id", "Bogføringsdag", "Handelsdag", "Valørdag", "Depot", "Transaktionstype",
  "Værdipapirer", "ISIN", "Antal", "Kurs", "Rente", "Samlede afgifter", "Valuta",
  "Beløb", "Valuta", "Indkøbsværdi", "Valuta", "Resultat", "Valuta", "Totalt antal",
  "Saldo", "Vekslingskurs", "Transaktionstekst", "Makuleringsdato", "Notanummer",
  "Verifikationsnummer", "Kurtage", "Valuta", "Middelkurs", "Oprindelig rente",
];

type Cells = Partial<{
  id: string; booked: string; trade: string; value: string; type: string; name: string;
  isin: string; qty: string; price: string; fees: string; feesCcy: string; amount: string;
  amountCcy: string; cost: string; costCcy: string; res: string; resCcy: string; fx: string; text: string;
  cancelled: string; verification: string;
}>;

function row(c: Cells): string {
  const cells = [
    c.id ?? "", c.booked ?? c.trade ?? "", c.trade ?? "", c.value ?? c.trade ?? "", "11111111",
    c.type ?? "", c.name ?? "", c.isin ?? "", c.qty ?? "", c.price ?? "", "", c.fees ?? "",
    c.feesCcy ?? "", c.amount ?? "", c.amountCcy ?? "", c.cost ?? "", c.costCcy ?? "", c.res ?? "", c.resCcy ?? "",
    "", "", c.fx ?? "", c.text ?? "", c.cancelled ?? "", "", c.verification ?? "", "", "", "", "",
  ];
  return cells.join("\t");
}

const buyNvda = row({
  id: "5000000003", trade: "2026-11-13", value: "2026-11-16", type: "KØBT", name: "NVIDIA",
  isin: "US67066G1040", qty: "2", price: "169,01", fees: "25", feesCcy: "DKK",
  amount: "-2317,17", amountCcy: "DKK", cost: "341,71", costCcy: "USD", fx: "6,7811",
  verification: "900003",
});
const dividendTax = row({
  id: "5000000005", booked: "2026-11-17", trade: "2026-11-11", value: "2026-11-16",
  type: "UDBYTTESKAT", name: "Apple", isin: "US0378331005", qty: "1", price: "0",
  amount: "-0,27", amountCcy: "DKK", text: "UDBYTTE AAPL 0.27 USD/AKSJE", verification: "900005",
});
const dividend = row({
  id: "5000000004", booked: "2026-11-17", trade: "2026-11-11", value: "2026-11-16",
  type: "UDBYTTE", name: "Apple", isin: "US0378331005", qty: "1", price: "0,27",
  amount: "1,83", amountCcy: "DKK", text: "UDBYTTE AAPL 0.27 USD/AKSJE", verification: "900005",
});
const deposit = row({
  id: "5000000002", trade: "2026-11-13", type: "INDBETALING", amount: "2400", amountCcy: "DKK",
  text: "ÖVERFÖRING",
});
const votingRight = row({
  id: "5000000006", trade: "2026-10-13", type: "FISSION INDLÆG",
  name: "Tesla Motors Inc Voting Right 2026", qty: "1", price: "0", amount: "0", amountCcy: "USD",
});
const buyApple = row({
  id: "5000000001", trade: "2026-08-27", value: "2026-08-28", type: "KØBT", name: "Apple",
  isin: "US0378331005", qty: "1", price: "310,39", fees: "25", feesCcy: "DKK",
  amount: "-2021,4", amountCcy: "DKK", cost: "314,28", costCcy: "USD", fx: "6,4319",
});

function file(...lines: string[]): string {
  return [HEADER.join("\t"), ...lines].join("\r\n") + "\r\n";
}

function parsed(text: string) {
  const result = parseNordnet(text);
  if (!result.ok) throw new Error("expected a Nordnet file");
  return result;
}

describe("parseNordnet", () => {
  it("reads the real encoding: UTF-16 LE with a byte order mark", () => {
    const bytes = new Uint8Array(Buffer.from(`﻿${file(buyNvda)}`, "utf16le"));
    const result = parsed(decodeText(bytes));
    expect(result.transactions).toHaveLength(1);
  });

  it("turns a buy into USD: price as is, the DKK fee divided by the exchange rate", () => {
    const [buy] = parsed(file(buyNvda)).transactions;
    expect(buy).toEqual({
      broker: "nordnet",
      externalId: "5000000003",
      line: 2,
      type: "buy",
      asset: { kind: "stock", isin: "US67066G1040", name: "NVIDIA" },
      quantity: "2",
      unitPrice: "169.01",
      fee: "3.6867174942", // 25 DKK / 6.7811
      currency: "USD",
      executedAt: "2026-11-13T12:00:00.000Z",
    });
  });

  it("joins a dividend with its withholding tax: gross amount, tax as the fee", () => {
    const result = parsed(file(dividendTax, dividend));
    expect(result.transactions).toEqual([
      expect.objectContaining({
        externalId: "5000000004",
        type: "dividend",
        asset: { kind: "stock", isin: "US0378331005", name: "Apple", symbol: "AAPL" },
        quantity: "1",
        unitPrice: "0.27",
        fee: "0.0398360656", // 0.27 DKK × 0.27 USD / 1.83 DKK
        executedAt: "2026-11-16T12:00:00.000Z", // payment day
      }),
    ]);
    expect(result.skipped).toEqual([]);
  });

  it("imports a dividend without tax with no fee", () => {
    const [div] = parsed(file(dividend)).transactions;
    expect(div.fee).toBeNull();
  });

  it("skips cash deposits and zero-value rows, listing them (decision 106)", () => {
    const result = parsed(file(deposit, votingRight));
    expect(result.transactions).toEqual([]);
    expect(result.skipped).toEqual([
      { line: 2, reason: "cash_movement", label: "INDBETALING", date: "2026-11-13" },
      { line: 3, reason: "zero_value", label: "Tesla Motors Inc Voting Right 2026", date: "2026-10-13" },
    ]);
  });

  it("skips stocks outside the US (decision 104), and their dividends and taxes", () => {
    const etf = row({
      id: "5000000010", trade: "2025-11-20", type: "KØBT",
      name: "iShares Core S&P 500 UCITS ETF USD (Dist)", isin: "IE0031442068", qty: "1",
      price: "58,018", fees: "25", feesCcy: "DKK", amount: "-459,44", amountCcy: "DKK",
      cost: "61,4", costCcy: "EUR", fx: "7,4877",
    });
    const etfDividend = row({
      id: "5000000011", trade: "2025-12-11", value: "2025-12-24", type: "UDBYTTE",
      name: "iShares Core S&P 500 ETF USD Dist", isin: "IE0031442068", qty: "1", price: "0,1598",
      amount: "1,02", amountCcy: "DKK", text: "UDBYTTE IUSA.DE 0.1598 USD/AKSJE",
      verification: "900011",
    });
    const result = parsed(file(etf, etfDividend));
    expect(result.transactions).toEqual([]);
    expect(result.skipped.map((s) => s.reason)).toEqual(["non_us", "non_us"]);
  });

  it("skips a US stock bought in another currency", () => {
    const inEur = row({
      id: "5000000012", trade: "2026-01-05", type: "KØBT", name: "Apple", isin: "US0378331005",
      qty: "1", price: "200", fees: "25", feesCcy: "DKK", cost: "203,35", costCcy: "EUR", fx: "7,46",
    });
    expect(parsed(file(inEur)).skipped).toEqual([
      { line: 2, reason: "unsupported_currency", label: "Apple", date: "2026-01-05" },
    ]);
  });

  it("lists a tax row whose dividend is not in the file", () => {
    expect(parsed(file(dividendTax)).skipped).toEqual([
      { line: 2, reason: "orphan_tax", label: "Apple", date: "2026-11-11" },
    ]);
  });

  it("skips cancelled rows", () => {
    const cancelled = buyNvda.replace("\t\t\t900003", "\t2026-11-14\t\t900003");
    expect(parsed(file(cancelled)).skipped[0].reason).toBe("cancelled");
  });

  // A sell leaves "Indkøbsværdi" empty and fills "Resultat" (Nordnet's realized P/L) instead.
  const buyGoogl = row({
    id: "5000000020", trade: "2025-04-07", value: "2025-04-08", type: "KØBT", name: "Alphabet A",
    isin: "US02079K3059", qty: "1", price: "141,24", fees: "25", feesCcy: "DKK",
    amount: "-988,27", amountCcy: "DKK", cost: "144,91", costCcy: "USD", fx: "6,8201",
  });
  const sellGoogl = row({
    id: "5000000021", trade: "2026-04-21", value: "2026-04-22", type: "SOLGT", name: "Alphabet A",
    isin: "US02079K3059", qty: "1", price: "338,7", fees: "25", feesCcy: "DKK",
    amount: "2120,62", amountCcy: "DKK", res: "189,84", resCcy: "USD", fx: "6,3348",
  });

  it("reads a sell like a buy, finding the price currency next to Resultat", () => {
    const result = parsed(file(sellGoogl));
    expect(result.transactions).toEqual([
      expect.objectContaining({
        type: "sell",
        quantity: "1",
        unitPrice: "338.7",
        fee: "3.9464545053", // 25 DKK / 6.3348
        executedAt: "2026-04-21T12:00:00.000Z",
      }),
    ]);
  });

  it("gives the same realized P/L as Nordnet's own Resultat column", () => {
    const { transactions } = parsed(file(sellGoogl, buyGoogl));
    const position = computePosition(
      transactions.map((t) => ({ ...t, id: t.externalId, createdAt: t.executedAt })),
    );
    // Nordnet rounds each leg to cents first (334.75 − 144.91 = 189.84); we keep
    // every decimal (189.8479…), so the two may differ by less than a cent.
    expect(position.realized.minus("189.84").abs().lt("0.01")).toBe(true);
  });

  it("rejects numbers it would have to guess, without importing the row", () => {
    const odd = buyNvda.replace("169,01", "1.169,01");
    const result = parsed(file(odd, buyApple));
    expect(result.errors).toEqual([{ line: 2, code: "invalid_number", field: "Kurs" }]);
    expect(result.transactions.map((t) => t.externalId)).toEqual(["5000000001"]);
  });

  it("reports a bad date", () => {
    const odd = buyNvda.replaceAll("2026-11-13", "13.11.2026");
    expect(parsed(file(odd)).errors).toEqual([{ line: 2, code: "invalid_date", field: "Handelsdag" }]);
  });

  it("returns transactions oldest first (the export is newest first)", () => {
    const result = parsed(file(buyNvda, deposit, buyApple));
    expect(result.transactions.map((t) => t.externalId)).toEqual(["5000000001", "5000000003"]);
    expect(result.transactions[0].fee).toBe("3.8868763507"); // 25 / 6.4319
  });

  it("tolerates short rows and blank lines", () => {
    const short = buyApple.replace(/\t+$/, "");
    const result = parsed(file(short, "", buyNvda));
    expect(result.transactions).toHaveLength(2);
    expect(result.errors).toEqual([]);
  });

  it("does not recognize other files", () => {
    expect(parseNordnet("Time,Coin,Amount\n2026-01-01,BTC,1")).toEqual({
      ok: false,
      error: "unrecognized_format",
    });
    expect(parseNordnet("")).toEqual({ ok: false, error: "unrecognized_format" });
  });
});
