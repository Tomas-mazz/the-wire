/**
 * Readers for Binance exports, checked against real files (2026-11-18).
 * All are UTF-8 CSV with a header row; times have no zone inside the file:
 * Binance writes the zone in the file name, e.g. "…-202611180853(UTC+1)-part1-of1.csv".
 *
 *   Fiat Buy History   Time, Method, Spend Amount, Receive Amount, Fee, Price, Status, Transaction ID
 *                      "1500.00 DKK", "0.00300674 BTC", "30.00 DKK". Spend includes the fee:
 *                      price = (spend − fee) / received, fee = fee
 *   Convert History    Time, Wallet, Pair, Type, Sell, Buy, Price, Inverse Price, Date Updated, Status
 *                      "196.90000000 EUR" → "0.00353984 BTC": price = money / coins, no fee
 *                      (Binance keeps its margin inside the rate)
 *   Spot Trade History Order No, Time, Pair, Side, Price, Executed, Amount, Fee, …
 *                      "0.0289ETH", "87.195924USDC", fee "0.08283613USDC" (number and coin glued).
 *                      Fee in the quote coin → fee as is. Fee in the bought coin → it is
 *                      valued at the trade price, and a buy's quantity is what actually
 *                      arrived (executed − fee), so quantity and cost both match Binance.
 *
 * The general "Transaction History" and "Withdraw History" have no prices, so they
 * are recognized and answered with `no_prices` instead of guessed.
 */
import type { Dec } from "@/domain";
import { isBlankRow, parseDelimited } from "./delimited";
import { dateTimeAtOffset, moneyCurrency, plainDecimal, ratio, splitAmount } from "./money";
import type {
  ImportResult,
  ImportedTransaction,
  RowError,
  RowErrorCode,
  SkippedRow,
  SkipReason,
} from "./types";

/** "(UTC+1)" in the file name → 60. No zone in the name → 0 (UTC). */
export function binanceOffsetMinutes(fileName: string): number {
  const m = /\(UTC([+-])(\d{1,2})(?::?(\d{2}))?\)/i.exec(fileName);
  if (!m) return 0;
  const minutes = Number(m[2]) * 60 + Number(m[3] ?? 0);
  return m[1] === "-" ? -minutes : minutes;
}

class RowProblem extends Error {
  constructor(
    readonly code: RowErrorCode,
    readonly field: string,
  ) {
    super(`${code}: ${field}`);
  }
}

type Kind = "fiat" | "convert" | "trade";

function kindOf(header: string[]): Kind | "no_prices" | null {
  const has = (...names: string[]) => names.every((n) => header.includes(n));
  if (has("Time", "Spend Amount", "Receive Amount", "Fee", "Status", "Transaction ID")) return "fiat";
  if (has("Time", "Pair", "Sell", "Buy", "Status")) return "convert";
  if (has("Time", "Pair", "Side", "Price", "Executed", "Amount", "Fee")) return "trade";
  if (has("Operation", "Coin", "Change")) return "no_prices";
  if (has("Coin", "Network", "Amount", "Address", "TXID")) return "no_prices";
  return null;
}

/** Null when the text is not a Binance export at all. */
export function parseBinance(text: string, fileName: string): ImportResult | null {
  const rows = parseDelimited(text, ",");
  const header = (rows[0] ?? []).map((cell) => cell.trim());
  const kind = kindOf(header);
  if (kind === null) return null;
  if (kind === "no_prices") return { ok: false, error: "no_prices" };

  const offset = binanceOffsetMinutes(fileName);
  const transactions: ImportedTransaction[] = [];
  const skipped: SkippedRow[] = [];
  const errors: RowError[] = [];

  rows.slice(1).forEach((cells, i) => {
    if (isBlankRow(cells)) return;
    const line = i + 2;
    const get = (name: string) => (cells[header.indexOf(name)] ?? "").trim();
    const day = get("Time").slice(0, 10);
    const skip = (reason: SkipReason, label: string) =>
      skipped.push({ line, reason, label, ...(/^\d{4}-\d{2}-\d{2}$/.test(day) ? { date: day } : {}) });
    const amount = (name: string) => {
      const value = splitAmount(get(name));
      if (!value) throw new RowProblem("invalid_number", name);
      return value;
    };
    const time = () => {
      const iso = dateTimeAtOffset(get("Time"), offset);
      if (!iso) throw new RowProblem("invalid_date", "Time");
      return iso;
    };
    const push = (
      externalId: string,
      type: "buy" | "sell",
      coin: string,
      quantity: Dec,
      unitPrice: string,
      fee: Dec | null,
      currency: string,
    ) => {
      if (quantity.lte(0)) throw new RowProblem("invalid_number", "quantity");
      transactions.push({
        broker: "binance",
        externalId,
        line,
        type,
        asset: { kind: "crypto", symbol: coin, name: coin },
        quantity: quantity.toFixed(),
        unitPrice,
        fee: fee && fee.gt(0) ? fee.toFixed() : null,
        currency,
        executedAt: time(),
      });
    };

    try {
      if (kind === "fiat") {
        const receive = amount("Receive Amount");
        if (get("Status") !== "Successful") return skip("failed", receive.code);
        const spend = amount("Spend Amount");
        const fee = amount("Fee");
        const currency = moneyCurrency(spend.code);
        if (!currency || fee.code !== spend.code) return skip("unsupported_currency", receive.code);
        if (moneyCurrency(receive.code)) return skip("unsupported_type", receive.code);
        if (receive.amount.lte(0)) throw new RowProblem("invalid_number", "Receive Amount");
        const paid = spend.amount.minus(fee.amount);
        push(
          get("Transaction ID") || `${get("Time")}|${get("Spend Amount")}`,
          "buy",
          receive.code,
          receive.amount,
          ratio(paid, receive.amount),
          fee.amount,
          currency,
        );
      } else if (kind === "convert") {
        const sell = amount("Sell");
        const buy = amount("Buy");
        if (get("Status") !== "Successful") return skip("failed", get("Pair"));
        const id = `${get("Time")}|${get("Pair")}|${get("Sell")}|${get("Buy")}`;
        const sellMoney = moneyCurrency(sell.code);
        const buyMoney = moneyCurrency(buy.code);
        if (sell.amount.lte(0) || buy.amount.lte(0)) throw new RowProblem("invalid_number", "Sell");
        if (sellMoney && !buyMoney) {
          push(id, "buy", buy.code, buy.amount, ratio(sell.amount, buy.amount), null, sellMoney);
        } else if (!sellMoney && buyMoney) {
          push(id, "sell", sell.code, sell.amount, ratio(buy.amount, sell.amount), null, buyMoney);
        } else {
          // Coin to coin (e.g. ETH → BTC) needs a dollar price for both sides.
          skip("unsupported_type", get("Pair"));
        }
      } else {
        const executed = amount("Executed");
        const total = amount("Amount");
        const fee = amount("Fee");
        const side = get("Side").toUpperCase();
        const price = plainDecimal(get("Price"));
        if (!price || price.lte(0)) throw new RowProblem("invalid_number", "Price");
        const currency = moneyCurrency(total.code);
        if (!currency) return skip("unsupported_currency", get("Pair"));
        if (side !== "BUY" && side !== "SELL") return skip("unsupported_type", get("Pair"));

        let quantity = executed.amount;
        let feeMoney: Dec;
        if (fee.code === total.code) {
          feeMoney = fee.amount;
        } else if (fee.code === executed.code) {
          feeMoney = fee.amount.times(price);
          if (side === "BUY") quantity = executed.amount.minus(fee.amount);
        } else {
          return skip("fee_in_other_coin", get("Pair"));
        }
        push(
          `${get("Order No")}|${get("Time")}|${get("Executed")}`,
          side === "BUY" ? "buy" : "sell",
          executed.code,
          quantity,
          price.toFixed(),
          feeMoney,
          currency,
        );
      }
    } catch (error) {
      if (!(error instanceof RowProblem)) throw error;
      errors.push({ line, code: error.code, field: error.field });
    }
  });

  transactions.sort((a, b) => a.executedAt.localeCompare(b.executedAt) || a.line - b.line);
  return { ok: true, broker: "binance", transactions, skipped, errors };
}
