/**
 * Builds the review table of an import: one status per row, prices in USD.
 * Pure: the server gathers rates, assets and existing rows, this decides.
 *
 *   duplicate    the same broker row was imported before (same external id)
 *   unresolved   the asset could not be identified (e.g. an unknown ISIN)
 *   lookup_failed  the price provider could not be reached to identify it (try again)
 *   no_rate      no exchange rate for that day and currency
 *   oversell     a sell of more than is held at that moment
 *   new          will be saved
 *
 * Conversion to USD (decision 104): usd = amount / rate, where rate is units
 * of the currency per 1 USD on the trade day (ECB), kept to 10 decimals.
 */
import { Dec, sortTransactions, ZERO, type Transaction } from "@/domain";
import type { ImportedAsset, ImportedTransaction } from "./types";

export type ReviewStatus = "new" | "duplicate" | "unresolved" | "lookup_failed" | "no_rate" | "oversell";

export interface ResolvedAsset {
  symbol: string;
  name: string;
  assetClass: "stock" | "etf" | "crypto";
  providerRefs: Record<string, string>;
}

export interface ReviewRow {
  /** `${broker}:${externalId}`, stored in transactions.external_id. */
  key: string;
  line: number;
  type: ImportedTransaction["type"];
  executedAt: string;
  /** What the file called the asset ("Alphabet A", "BTC"). */
  label: string;
  asset: ResolvedAsset | null;
  quantity: string;
  /** In USD; null when there was no rate. */
  unitPrice: string | null;
  fee: string | null;
  /** The currency the file used, before conversion. */
  currency: string;
  status: ReviewStatus;
  brokerName?: string;
  note?: string;
}

export interface ReviewInput {
  transactions: readonly ImportedTransaction[];
  /** rateKey(day, currency) → units per USD, or null when the rate could not be fetched. */
  rates: ReadonlyMap<string, string | null>;
  /** assetKey(asset) → what it resolved to, null when nobody knows it, or "lookup_failed". */
  assets: ReadonlyMap<string, ResolvedAsset | null | "lookup_failed">;
  /** external_id values already saved for this user. */
  existingKeys: ReadonlySet<string>;
  /** identity(resolved asset) → that asset's ledger in the target project. */
  ledgers: ReadonlyMap<string, readonly Transaction[]>;
}

export const externalKey = (tx: Pick<ImportedTransaction, "broker" | "externalId">) => `${tx.broker}:${tx.externalId}`;
export const assetKey = (asset: ImportedAsset) => (asset.isin ? `isin:${asset.isin}` : `${asset.kind}:${asset.symbol}`);
export const rateKey = (day: string, currency: string) => `${day}|${currency}`;
export const identity = (asset: Pick<ResolvedAsset, "assetClass" | "symbol">) => `${asset.assetClass}:${asset.symbol}`;

function toUsd(amount: string, rate: string): string {
  return new Dec(amount).div(rate).toDecimalPlaces(10).toFixed();
}

/**
 * Ids of incoming sells that would sell more than is held, replaying the
 * existing ledger together with the incoming rows (same order as src/domain).
 * A failing sell is left out of the replay so the rows after it are judged fairly.
 */
export function findOversells(existing: readonly Transaction[], incoming: readonly Transaction[]): Set<string> {
  const incomingIds = new Set(incoming.map((t) => t.id));
  const failing = new Set<string>();
  let held = ZERO;
  for (const tx of sortTransactions([...existing, ...incoming])) {
    const q = new Dec(tx.quantity);
    if (tx.type === "buy" || tx.type === "reward") held = held.plus(q);
    else if (tx.type === "sell") {
      if (q.gt(held) && incomingIds.has(tx.id)) failing.add(tx.id);
      else held = held.minus(q);
    }
  }
  return failing;
}

export function buildReview(input: ReviewInput): ReviewRow[] {
  const rows: ReviewRow[] = input.transactions.map((tx) => {
    const key = externalKey(tx);
    const found = input.assets.get(assetKey(tx.asset)) ?? null;
    const asset = found === "lookup_failed" ? null : found;

    let unitPrice: string | null = tx.unitPrice;
    let fee: string | null = tx.fee;
    let hasRate = true;
    if (tx.currency !== "USD") {
      const rate = input.rates.get(rateKey(tx.executedAt.slice(0, 10), tx.currency)) ?? null;
      hasRate = rate !== null;
      unitPrice = rate ? toUsd(tx.unitPrice, rate) : null;
      fee = rate && tx.fee ? toUsd(tx.fee, rate) : null;
    }

    const status: ReviewStatus = input.existingKeys.has(key)
      ? "duplicate"
      : found === "lookup_failed"
        ? "lookup_failed"
        : asset === null
          ? "unresolved"
          : !hasRate
            ? "no_rate"
            : "new";

    return {
      key,
      line: tx.line,
      type: tx.type,
      executedAt: tx.executedAt,
      label: tx.asset.symbol ?? tx.asset.name,
      asset,
      quantity: tx.quantity,
      unitPrice,
      fee,
      currency: tx.currency,
      status,
      ...(tx.brokerName ? { brokerName: tx.brokerName } : {}),
      ...(tx.note ? { note: tx.note } : {}),
    };
  });

  // Sells are judged per asset, against what the project already holds plus the new rows.
  const byAsset = new Map<string, ReviewRow[]>();
  for (const row of rows) {
    if (row.status !== "new" || !row.asset) continue;
    const id = identity(row.asset);
    byAsset.set(id, [...(byAsset.get(id) ?? []), row]);
  }
  for (const [id, group] of byAsset) {
    const incoming: Transaction[] = group.map((row, i) => ({
      id: row.key,
      type: row.type,
      quantity: row.quantity,
      unitPrice: row.unitPrice ?? "0",
      fee: row.fee,
      executedAt: row.executedAt,
      // Saved in this order, so same-time rows replay as they appear in the file.
      createdAt: new Date(Date.UTC(2100, 0, 1) + i).toISOString(),
    }));
    const failing = findOversells(input.ledgers.get(id) ?? [], incoming);
    for (const row of group) if (failing.has(row.key)) row.status = "oversell";
  }

  return rows.sort((a, b) => a.executedAt.localeCompare(b.executedAt) || a.line - b.line);
}
