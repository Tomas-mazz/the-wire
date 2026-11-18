import { describe, expect, it } from "vitest";
import type { Transaction } from "@/domain";
import { buildReview, findOversells, rateKey, type ResolvedAsset, type ReviewInput } from "./review";
import type { ImportedTransaction } from "./types";

const BTC: ResolvedAsset = { symbol: "BTC", name: "Bitcoin", assetClass: "crypto", providerRefs: { coingecko: "bitcoin" } };
const GOOGL: ResolvedAsset = { symbol: "GOOGL", name: "Alphabet Inc.", assetClass: "stock", providerRefs: { finnhub: "GOOGL" } };

function tx(over: Partial<ImportedTransaction>): ImportedTransaction {
  return {
    broker: "binance",
    externalId: "1",
    line: 2,
    type: "buy",
    asset: { kind: "crypto", symbol: "BTC", name: "BTC" },
    quantity: "1",
    unitPrice: "100",
    fee: null,
    currency: "USD",
    executedAt: "2026-06-01T10:00:00.000Z",
    ...over,
  };
}

function input(over: Partial<ReviewInput>): ReviewInput {
  return {
    transactions: [],
    rates: new Map(),
    assets: new Map([
      ["crypto:BTC", BTC],
      ["isin:US02079K3059", GOOGL],
    ]),
    existingKeys: new Set(),
    ledgers: new Map(),
    ...over,
  };
}

describe("buildReview", () => {
  it("converts a DKK price and fee to USD with the day's rate", () => {
    const [row] = buildReview(
      input({
        transactions: [tx({ unitPrice: "488901.601069597", fee: "30", currency: "DKK" })],
        rates: new Map([[rateKey("2026-06-01", "DKK"), "6.4174"]]),
      }),
    );
    expect(row).toEqual(
      expect.objectContaining({
        key: "binance:1",
        status: "new",
        asset: BTC,
        unitPrice: "76183.7505951938", // 488901.60 DKK / 6.4174 DKK per USD
        fee: "4.6747904136",
        currency: "DKK",
      }),
    );
  });

  it("marks rows already imported, unknown assets and missing rates", () => {
    const rows = buildReview(
      input({
        transactions: [
          tx({ externalId: "a" }),
          tx({ externalId: "b", asset: { kind: "stock", isin: "US0000000000", name: "Mystery" } }),
          tx({ externalId: "c", currency: "EUR", fee: "1" }),
        ],
        existingKeys: new Set(["binance:a"]),
      }),
    );
    expect(rows.map((r) => [r.key, r.status, r.label])).toEqual([
      ["binance:a", "duplicate", "BTC"],
      ["binance:b", "unresolved", "Mystery"],
      ["binance:c", "no_rate", "BTC"],
    ]);
    expect(rows[2]).toEqual(expect.objectContaining({ unitPrice: null, fee: null }));
  });

  it("resolves Nordnet stocks by ISIN", () => {
    const [row] = buildReview(
      input({
        transactions: [tx({ broker: "nordnet", asset: { kind: "stock", isin: "US02079K3059", name: "Alphabet A" } })],
      }),
    );
    expect(row.asset).toBe(GOOGL);
    expect(row.label).toBe("Alphabet A");
  });

  it("flags a sell of coins that are neither in the file nor in the project", () => {
    const rows = buildReview(
      input({
        transactions: [
          tx({ externalId: "s1", type: "sell", quantity: "0.5", executedAt: "2026-06-01T10:00:00.000Z" }),
          tx({ externalId: "b1", type: "buy", quantity: "1", executedAt: "2026-06-02T10:00:00.000Z" }),
          tx({ externalId: "s2", type: "sell", quantity: "0.5", executedAt: "2026-06-03T10:00:00.000Z" }),
        ],
      }),
    );
    expect(rows.map((r) => [r.key, r.status])).toEqual([
      ["binance:s1", "oversell"],
      ["binance:b1", "new"],
      ["binance:s2", "new"],
    ]);
  });

  it("counts what the project already holds", () => {
    const held: Transaction = {
      id: "old",
      type: "buy",
      quantity: "2",
      unitPrice: "50",
      executedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const [row] = buildReview(
      input({ transactions: [tx({ type: "sell", quantity: "1.5" })], ledgers: new Map([["crypto:BTC", [held]]]) }),
    );
    expect(row.status).toBe("new");
  });
});

describe("findOversells", () => {
  it("never blames rows that were already saved", () => {
    const saved: Transaction = {
      id: "old-sell",
      type: "sell",
      quantity: "5",
      unitPrice: "1",
      executedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    expect(findOversells([saved], [])).toEqual(new Set());
  });
});
