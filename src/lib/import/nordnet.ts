/**
 * Reader for Nordnet's "transactions and notes" export (Denmark).
 *
 * Format, checked against a real export (2026-11-18):
 *   - UTF-16 LE with BOM (decode with decodeText first), tab separated, CRLF
 *   - decimal comma, no thousands separator ("-2317,17"), dates as YYYY-MM-DD
 *   - several columns are all called "Valuta": each one is the currency of
 *     the column just before it, so they are found by position
 *   - newest row first; "Id" is unique per row and is the dedupe key
 *   - stocks are named, not tickered ("Alphabet A"), plus their ISIN
 *
 * Conversions (decision 104: US stocks bought from a DKK account → USD):
 *   buy (KØBT) and sell (SOLGT):
 *                price = Kurs (already in the stock's currency, must be USD)
 *                fee   = Samlede afgifter / Vekslingskurs   (DKK ÷ DKK-per-USD)
 *   dividend (UDBYTTE + UDBYTTESKAT with the same Verifikationsnummer,
 *   decision 105):
 *                gross USD = Antal × Kurs  (per-share amount, USD per the text)
 *                fee       = withheld DKK × gross USD / gross DKK
 *                (the row has no exchange rate, so the rate implied by the
 *                dividend itself converts its tax)
 *
 * Divisions are rounded to 10 decimals; everything else keeps the file's digits.
 */
import { Dec, ZERO } from "@/domain";
import { dateAtNoonUtc, isBlankRow, isIsoDate, parseDelimited } from "./delimited";
import type {
  ImportResult,
  ImportedTransaction,
  RowError,
  RowErrorCode,
  SkippedRow,
  SkipReason,
} from "./types";

const REQUIRED_HEADERS = [
  "Id",
  "Handelsdag",
  "Valørdag",
  "Transaktionstype",
  "Værdipapirer",
  "ISIN",
  "Antal",
  "Kurs",
  "Samlede afgifter",
  "Beløb",
  "Indkøbsværdi",
  "Vekslingskurs",
  "Transaktionstekst",
  "Verifikationsnummer",
];

const DIVIDEND_TEXT = /(\d+(?:[.,]\d+)?)\s*([A-Z]{3})\s*\/\s*(?:AKSJE|AKTIE|SHARE)/i;
const DIVIDEND_TICKER = /^UDBYTTE\s+([A-Z][A-Z0-9]*)\s/i;

class RowProblem extends Error {
  constructor(
    readonly code: RowErrorCode,
    readonly field: string,
  ) {
    super(`${code}: ${field}`);
  }
}

/** "-2317,17" → Dec(-2317.17); "" → null. Anything else (e.g. "1.234,5") is rejected, never guessed. */
function nordnetNumber(text: string, field: string): Dec | null {
  if (text === "") return null;
  if (!/^-?\d+(,\d+)?$/.test(text)) throw new RowProblem("invalid_number", field);
  return new Dec(text.replace(",", "."));
}

function required(value: Dec | null, field: string): Dec {
  if (value === null) throw new RowProblem("missing_field", field);
  return value;
}

function divide(a: Dec, b: Dec): string {
  return a.div(b).toDecimalPlaces(10).toFixed();
}

export function parseNordnet(text: string): ImportResult {
  const rows = parseDelimited(text, "\t");
  const header = (rows[0] ?? []).map((cell) => cell.trim());
  if (!REQUIRED_HEADERS.every((name) => header.includes(name))) {
    return { ok: false, error: "unrecognized_format" };
  }

  const col = (name: string) => header.indexOf(name);
  /** The "Valuta" column right after `name`, or -1. */
  const currencyOf = (name: string) => (header[col(name) + 1] === "Valuta" ? col(name) + 1 : -1);

  const C = {
    id: col("Id"),
    tradeDate: col("Handelsdag"),
    valueDate: col("Valørdag"),
    type: col("Transaktionstype"),
    name: col("Værdipapirer"),
    isin: col("ISIN"),
    quantity: col("Antal"),
    price: col("Kurs"),
    fees: col("Samlede afgifter"),
    feesCurrency: currencyOf("Samlede afgifter"),
    amount: col("Beløb"),
    amountCurrency: currencyOf("Beløb"),
    costCurrency: currencyOf("Indkøbsværdi"),
    resultCurrency: currencyOf("Resultat"),
    fx: col("Vekslingskurs"),
    text: col("Transaktionstekst"),
    cancelled: col("Makuleringsdato"),
    verification: col("Verifikationsnummer"),
  };

  interface Row {
    line: number;
    get: (index: number) => string;
  }
  const records: Row[] = [];
  rows.slice(1).forEach((cells, i) => {
    if (isBlankRow(cells)) return;
    records.push({ line: i + 2, get: (index) => (index < 0 ? "" : (cells[index] ?? "").trim()) });
  });

  const transactions: ImportedTransaction[] = [];
  const skipped: SkippedRow[] = [];
  const errors: RowError[] = [];

  // Withholding-tax rows, waiting for their dividend.
  const taxKey = (row: Row) => `${row.get(C.verification)}|${row.get(C.isin)}`;
  const taxes = new Map<string, Row>();
  for (const row of records) {
    if (row.get(C.type) === "UDBYTTESKAT") taxes.set(taxKey(row), row);
  }
  const usedTaxes = new Set<string>();

  const skip = (row: Row, reason: SkipReason) => {
    const date = row.get(C.tradeDate);
    skipped.push({
      line: row.line,
      reason,
      label: row.get(C.name) || row.get(C.type),
      ...(isIsoDate(date) ? { date } : {}),
    });
  };

  const tradeDate = (row: Row): string => {
    const date = row.get(C.tradeDate);
    if (!isIsoDate(date)) throw new RowProblem("invalid_date", "Handelsdag");
    return date;
  };

  const base = (row: Row) => {
    const id = row.get(C.id);
    if (id === "") throw new RowProblem("missing_field", "Id");
    return {
      broker: "nordnet" as const,
      externalId: id,
      line: row.line,
      asset: { kind: "stock" as const, isin: row.get(C.isin), name: row.get(C.name) },
    };
  };

  /**
   * Currency of Kurs. Buys fill "Indkøbsværdi" (cost) and its currency; sells
   * leave it empty and fill "Resultat" (realized P/L) and its currency instead.
   */
  const priceCurrency = (row: Row) => row.get(C.costCurrency) || row.get(C.resultCurrency);

  const readTrade = (row: Row, type: "buy" | "sell") => {
    const date = tradeDate(row);
    const quantity = required(nordnetNumber(row.get(C.quantity), "Antal"), "Antal");
    const price = required(nordnetNumber(row.get(C.price), "Kurs"), "Kurs");
    if (quantity.lte(0)) throw new RowProblem("invalid_number", "Antal");
    if (price.lt(0)) throw new RowProblem("invalid_number", "Kurs");

    let fee: string | null = null;
    const fees = nordnetNumber(row.get(C.fees), "Samlede afgifter") ?? ZERO;
    if (fees.gt(0)) {
      if (row.get(C.feesCurrency) === "USD") {
        fee = fees.toFixed();
      } else {
        const fx = required(nordnetNumber(row.get(C.fx), "Vekslingskurs"), "Vekslingskurs");
        if (fx.lte(0)) throw new RowProblem("invalid_number", "Vekslingskurs");
        fee = divide(fees, fx);
      }
    }

    transactions.push({
      ...base(row),
      type,
      quantity: quantity.toFixed(),
      unitPrice: price.toFixed(),
      fee,
      currency: "USD",
      executedAt: dateAtNoonUtc(date),
    });
  };

  const readDividend = (row: Row) => {
    tradeDate(row);
    const valueDate = row.get(C.valueDate);
    const date = isIsoDate(valueDate) ? valueDate : tradeDate(row);

    const match = DIVIDEND_TEXT.exec(row.get(C.text));
    if (!match || match[2].toUpperCase() !== "USD") return skip(row, "unsupported_currency");

    const quantity = required(nordnetNumber(row.get(C.quantity), "Antal"), "Antal");
    if (quantity.lte(0)) throw new RowProblem("invalid_number", "Antal");
    const fromColumn = nordnetNumber(row.get(C.price), "Kurs");
    const perShare = fromColumn && fromColumn.gt(0) ? fromColumn : new Dec(match[1].replace(",", "."));

    let fee: string | null = null;
    const tax = taxes.get(taxKey(row));
    if (tax) {
      const withheld = required(nordnetNumber(tax.get(C.amount), "Beløb"), "Beløb").abs();
      if (withheld.gt(0)) {
        if (row.get(C.amountCurrency) === "USD") {
          fee = withheld.toFixed();
        } else {
          const grossLocal = required(nordnetNumber(row.get(C.amount), "Beløb"), "Beløb");
          if (grossLocal.lte(0)) throw new RowProblem("invalid_number", "Beløb");
          fee = divide(withheld.times(quantity).times(perShare), grossLocal);
        }
      }
    }

    const ticker = DIVIDEND_TICKER.exec(row.get(C.text))?.[1]?.toUpperCase();
    const common = base(row);
    transactions.push({
      ...common,
      asset: { ...common.asset, ...(ticker ? { symbol: ticker } : {}) },
      type: "dividend",
      quantity: quantity.toFixed(),
      unitPrice: perShare.toFixed(),
      fee,
      currency: "USD",
      executedAt: dateAtNoonUtc(date),
    });
  };

  for (const row of records) {
    const type = row.get(C.type);
    try {
      if (type === "UDBYTTESKAT") continue; // handled with its dividend
      if (row.get(C.cancelled) !== "") {
        skip(row, "cancelled");
        continue;
      }

      if (type === "KØBT" || type === "SOLGT" || type === "UDBYTTE") {
        if (type === "UDBYTTE") usedTaxes.add(taxKey(row));
        const isin = row.get(C.isin);
        if (isin === "") throw new RowProblem("missing_field", "ISIN");
        if (!isin.startsWith("US")) {
          skip(row, "non_us");
          continue;
        }
        if (type === "UDBYTTE") {
          readDividend(row);
        } else if (priceCurrency(row) !== "USD") {
          skip(row, "unsupported_currency");
        } else {
          readTrade(row, type === "KØBT" ? "buy" : "sell");
        }
      } else if (type === "INDBETALING") {
        skip(row, "cash_movement");
      } else {
        const amount = nordnetNumber(row.get(C.amount), "Beløb") ?? ZERO;
        const price = nordnetNumber(row.get(C.price), "Kurs") ?? ZERO;
        skip(row, amount.isZero() && price.isZero() ? "zero_value" : "unsupported_type");
      }
    } catch (error) {
      if (!(error instanceof RowProblem)) throw error;
      errors.push({ line: row.line, code: error.code, field: error.field });
    }
  }

  for (const [key, row] of taxes) {
    if (!usedTaxes.has(key)) skip(row, "orphan_tax");
  }

  // Oldest first, so a buy is replayed before a later sell of the same day.
  transactions.sort(
    (a, b) =>
      a.executedAt.localeCompare(b.executedAt) ||
      a.externalId.localeCompare(b.externalId, undefined, { numeric: true }),
  );
  skipped.sort((a, b) => a.line - b.line);

  return { ok: true, broker: "nordnet", transactions, skipped, errors };
}
