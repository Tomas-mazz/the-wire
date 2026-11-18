import { describe, expect, it } from "vitest";
import { parseCoinbase } from "./coinbase";

// Same preamble, headers and value styles as a real Coinbase statement; the values are made up.
const HEADER =
  "ID,Timestamp,Transaction Type,Asset,Quantity Transacted,Price Currency,Price at Transaction,Subtotal,Total (inclusive of fees and/or spread),Fees and/or Spread,Notes,Sender Address,Recipient Address";
const statement = [
  "",
  "Transactions",
  "User,Test User,00000000-0000-0000-0000-000000000000",
  HEADER,
  "aaa3,2026-11-13 12:18:11 UTC,Send,BTC,-0.01387575,USD,$69382.67,-$962.73,-$962.32,$0.40,Sent 0.01387575 BTC to bc1qexample,,bc1qexample",
  "aaa2,2026-11-13 12:17:05 UTC,Buy,BTC,0.01387575,USD,$69433.07142115610802858853174,$963.43594,$988.26721,$24.831268633136916065312680708695,Bought 0.01387575 BTC for 988.27 USD using EUR,,",
  "aaa1,2026-11-13 12:16:25 UTC,Deposit,EUR,894.03,USD,$1.1054,$988.26721,$988.26721,$0.00,Deposit from a bank,,",
  "aaa4,2026-11-09 20:01:23 UTC,Retail Simple Price Improvement,EURC,0.045184,USD,$1.1196,$0.05059,$0.05059,$0.00,,,",
  "aaa5,2026-11-20 09:00:00 UTC,Sell,BTC,-0.005,USD,$70000,$350,$347.5,$2.5,Sold,,",
].join("\n");

function parsed(text: string) {
  const result = parseCoinbase(text);
  if (!result?.ok) throw new Error("expected a Coinbase statement");
  return result;
}

describe("parseCoinbase", () => {
  const result = parsed(statement);

  it("finds the table after the preamble and reads a buy at full precision", () => {
    expect(result.transactions[0]).toEqual({
      broker: "coinbase",
      externalId: "aaa2",
      line: 6,
      type: "buy",
      asset: { kind: "crypto", symbol: "BTC", name: "BTC" },
      quantity: "0.01387575",
      unitPrice: "69433.07142115610802858853174",
      fee: "24.831268633136916065312680708695",
      currency: "USD",
      executedAt: "2026-11-13T12:17:05.000Z",
    });
  });

  it("reads a sell with a positive quantity", () => {
    expect(result.transactions[1]).toEqual(
      expect.objectContaining({ type: "sell", quantity: "0.005", unitPrice: "70000", fee: "2.5" }),
    );
  });

  it("skips sends, money deposits and unknown types, listing each", () => {
    expect(result.skipped).toEqual([
      { line: 5, reason: "transfer", label: "BTC", date: "2026-11-13" },
      { line: 7, reason: "cash_movement", label: "EUR", date: "2026-11-13" },
      { line: 8, reason: "unsupported_type", label: "Retail Simple Price Improvement EURC", date: "2026-11-09" },
    ]);
  });

  it("reports a bad number", () => {
    const broken = statement.replace("$70000", "$70k");
    expect(parsed(broken).errors).toEqual([{ line: 9, code: "invalid_number", field: "Price at Transaction" }]);
  });

  it("returns null for other files", () => {
    expect(parseCoinbase("Time,Coin\n1,2")).toBeNull();
  });
});
