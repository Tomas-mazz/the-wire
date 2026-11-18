import { describe, expect, it } from "vitest";
import { binanceOffsetMinutes, parseBinance } from "./binance";

// Same headers and value styles as real Binance exports; the numbers are made up.
const FIAT_NAME = "Binance-Fiat-Buy-History-202611180944(UTC+1)-part1-of1.csv";
const fiat = [
  "﻿Time,Method,Spend Amount,Receive Amount,Fee,Price,Status,Transaction ID",
  "2026-09-03 06:51:26,Balance,196.00 EUR,0.0029107 BTC,0.00 EUR,67337.75380493 BTC/EUR,Successful,N01",
  "2026-06-01 18:49:23,Card / Apple Pay / Google Pay,1500.00 DKK,0.00300674 BTC,30.00 DKK,488901.6010696 BTC/DKK,Successful,N02",
  "2026-06-01 18:45:59,Card / Apple Pay / Google Pay,1500.00 DKK,0 BTC,0.00 DKK,0 BTC/DKK,Failed,N03",
].join("\n");

const convert = [
  "﻿Time,Wallet,Pair,Type,Sell,Buy,Price,Inverse Price,Date Updated,Status",
  "2026-08-12 06:46:28,SPOT,BTCEUR,Instant,196.90000000 EUR,0.00353984 BTC,1 EUR=1.79779E-5 BTC,1 BTC=55624.0 EUR,2026-08-12 06:46:29,Successful",
  "2026-05-19 20:25:09,SPOT,BTCUSDC,Instant,68.81340616 USDC,0.00089220 BTC,1 USDC=1.29655E-5 BTC,1 BTC=77127.7 USDC,2026-05-19 20:25:10,Successful",
  "2026-05-20 10:00:00,SPOT,ETHBTC,Instant,0.01000000 ETH,0.00030000 BTC,x,y,2026-05-20 10:00:01,Successful",
  "2026-05-21 10:00:00,SPOT,BTCUSDT,Instant,0.00100000 BTC,70.00000000 USDT,x,y,2026-05-21 10:00:01,Successful",
].join("\n");

const trades = [
  "﻿Order No,Time,Pair,Side,Price,Executed,Amount,Fee,AOR Conversion Pair,AOR Conversion Rate",
  "8049349399,2025-11-20 10:25:50,ETHUSDC,SELL,3017.16,0.0289ETH,87.195924USDC,0.08283613USDC,,",
  "5888885240,2025-07-22 19:54:24,BTCUSDC,BUY,120000,0.001BTC,120USDC,0.000001BTC,,",
  "5888885241,2025-07-23 19:54:24,BTCUSDC,BUY,120000,0.001BTC,120USDC,0.0001BNB,,",
  "5888885242,2025-07-24 19:54:24,ETHBTC,BUY,0.03,0.1ETH,0.003BTC,0.0001BTC,,",
].join("\n");

function parsed(text: string, name = FIAT_NAME) {
  const result = parseBinance(text, name);
  if (!result?.ok) throw new Error("expected a Binance file");
  return result;
}

describe("binanceOffsetMinutes", () => {
  it("reads the time zone Binance puts in the file name", () => {
    expect(binanceOffsetMinutes(FIAT_NAME)).toBe(60);
    expect(binanceOffsetMinutes("x(UTC-5)-part1.csv")).toBe(-300);
    expect(binanceOffsetMinutes("x(UTC+5:30).csv")).toBe(330);
    expect(binanceOffsetMinutes("renamed.csv")).toBe(0);
  });
});

describe("parseBinance: Fiat Buy History", () => {
  it("separates the fee from what was spent and keeps the original currency", () => {
    expect(parsed(fiat).transactions).toEqual([
      {
        broker: "binance",
        externalId: "N02",
        line: 3,
        type: "buy",
        asset: { kind: "crypto", symbol: "BTC", name: "BTC" },
        quantity: "0.00300674",
        unitPrice: "488901.601069597", // (1500 − 30) DKK / 0.00300674
        fee: "30",
        currency: "DKK",
        executedAt: "2026-06-01T17:49:23.000Z", // 18:49 at UTC+1
      },
      expect.objectContaining({ externalId: "N01", fee: null, currency: "EUR", unitPrice: "67337.7538049266" }),
    ]);
  });

  it("lists failed payments as skipped", () => {
    expect(parsed(fiat).skipped).toEqual([{ line: 4, reason: "failed", label: "BTC", date: "2026-06-01" }]);
  });
});

describe("parseBinance: Convert History", () => {
  const result = parsed(convert, "Binance-Convert-Order-History-202611180949(UTC+1)-part1-of1.csv");

  it("turns money → coin into a buy and coin → stablecoin into a sell", () => {
    expect(result.transactions.map((t) => [t.type, t.quantity, t.unitPrice, t.currency, t.fee])).toEqual([
      ["buy", "0.0008922", "77127.7809459762", "USD", null], // USDC counts as USD
      ["sell", "0.001", "70000", "USD", null],
      ["buy", "0.00353984", "55623.9830048816", "EUR", null],
    ]);
  });

  it("skips coin-to-coin conversions", () => {
    expect(result.skipped).toEqual([{ line: 4, reason: "unsupported_type", label: "ETHBTC", date: "2026-05-20" }]);
  });
});

describe("parseBinance: Spot Trade History", () => {
  const result = parsed(trades, "Binance-Spot-Trade-History-202611180853(UTC+1)-part1-of1.csv");

  it("values a fee paid in the bought coin and keeps only what arrived", () => {
    expect(result.transactions[0]).toEqual(
      expect.objectContaining({ type: "buy", quantity: "0.000999", unitPrice: "120000", fee: "0.12" }),
    );
  });

  it("reads a sell with the fee in the stablecoin", () => {
    expect(result.transactions[1]).toEqual(
      expect.objectContaining({
        type: "sell",
        asset: { kind: "crypto", symbol: "ETH", name: "ETH" },
        quantity: "0.0289",
        unitPrice: "3017.16",
        fee: "0.08283613",
        currency: "USD",
      }),
    );
  });

  it("skips fees in a third coin and trades priced in another coin", () => {
    expect(result.skipped.map((s) => [s.line, s.reason])).toEqual([
      [4, "fee_in_other_coin"],
      [5, "unsupported_currency"],
    ]);
  });
});

describe("parseBinance: other files", () => {
  it("recognizes Binance files without prices and says so", () => {
    const history = "User ID,Time,Account,Operation,Coin,Change,Remark\n1,2026-01-01 00:00:00,Spot,Deposit,BTC,1,";
    expect(parseBinance(history, "a.csv")).toEqual({ ok: false, error: "no_prices" });
    const withdrawals = "Time,Coin,Network,Amount,Fee,Address,TXID,Status\n";
    expect(parseBinance(withdrawals, "a.csv")).toEqual({ ok: false, error: "no_prices" });
  });

  it("returns null for files from other brokers", () => {
    expect(parseBinance("a,b,c\n1,2,3", "a.csv")).toBeNull();
  });

  it("reports a broken amount without importing the row", () => {
    const broken = fiat.replace("196.00 EUR", "196;00 EUR");
    expect(parsed(broken).errors).toEqual([{ line: 2, code: "invalid_number", field: "Spend Amount" }]);
  });
});
