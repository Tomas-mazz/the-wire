/**
 * CSV export of transactions (M8, decisions 118–121). Pure: no React, no
 * network; unit-tested in csv.test.ts.
 *
 * Columns are the The Wire import template's plus `project`, so the file can
 * be imported again (the reader ignores columns it doesn't know):
 *
 *   date,type,symbol,asset_type,quantity,price,fee,currency,broker,note,project
 *
 *  - date: "2026-11-13 14:30" in the user's time zone, which is how the
 *    template reads it back;
 *  - quantity, price, fee: the exact decimals saved in the database (USD);
 *  - currency: always USD, the currency every price is stored in;
 *  - cash deposits and withdrawals are included (type deposit / withdrawal)
 *    to keep the copy complete; the template can't import them back.
 * Oldest first. Cells with a comma, quote or line break are quoted, and text
 * starting with = + - @ gets a leading ' so a spreadsheet never runs it as a
 * formula. The file starts with a byte order mark so Excel reads accents.
 */
import { TEMPLATE_HEADERS } from "@/lib/import/template";
import { utcToZonedLocal } from "@/lib/portfolio/parse";

export const EXPORT_HEADERS = [...TEMPLATE_HEADERS, "project"] as const;

/** What the export needs from a transaction row. */
export interface ExportRow {
  projectId: string;
  type: string;
  quantity: string;
  unitPrice: string;
  fee: string | null;
  executedAt: string;
  createdAt: string;
  broker: string | null;
  note: string | null;
  asset: { symbol: string; assetClass: string };
}

const BOM = "﻿";

/** Text a spreadsheet could take for a formula gets a leading apostrophe. */
function safeText(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** Quotes a cell when it holds a comma, a quote or a line break (RFC 4180). */
function cell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function transactionsCsv(
  rows: readonly ExportRow[],
  projectNames: ReadonlyMap<string, string>,
  timeZone: string,
): string {
  const sorted = [...rows].sort(
    (a, b) => a.executedAt.localeCompare(b.executedAt) || a.createdAt.localeCompare(b.createdAt),
  );
  const lines = sorted.map((row) =>
    [
      utcToZonedLocal(row.executedAt, timeZone).replace("T", " "),
      row.type,
      safeText(row.asset.symbol),
      row.asset.assetClass,
      row.quantity,
      row.unitPrice,
      row.fee ?? "",
      "USD",
      safeText(row.broker ?? ""),
      safeText(row.note ?? ""),
      safeText(projectNames.get(row.projectId) ?? ""),
    ]
      .map(cell)
      .join(","),
  );
  return `${BOM}${[EXPORT_HEADERS.join(","), ...lines].join("\r\n")}\r\n`;
}

/** "the-wire-transactions-2026-11-25.csv", dated in the user's time zone. */
export function exportFileName(now: number, timeZone: string): string {
  return `the-wire-transactions-${utcToZonedLocal(new Date(now).toISOString(), timeZone).slice(0, 10)}.csv`;
}
