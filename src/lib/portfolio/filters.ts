import { TRANSACTION_TYPES, type TransactionType } from "@/domain";
import type { TransactionFilters } from "./data";
import { isUuid, zonedLocalToUtc } from "./parse";

export type SearchParams = Record<string, string | string[] | undefined>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const one = (v: string | string[] | null | undefined) => (typeof v === "string" ? v : "");

/**
 * Reads the Transactions tab's filters from the URL, ignoring anything
 * malformed. Shared by the tab and the CSV export, so the file holds exactly
 * the rows on screen (decision 119). Dates are whole days in the user's time
 * zone: from 00:00 to 23:59:59.999.
 */
export function readTransactionFilters(params: SearchParams, timeZone: string) {
  const project = one(params.project);
  const asset = one(params.asset);
  const type = one(params.type);
  const from = one(params.from);
  const to = one(params.to);

  const filters: TransactionFilters = {};
  if (isUuid(project)) filters.projectId = project;
  if (isUuid(asset)) filters.assetId = asset;
  if ((TRANSACTION_TYPES as readonly string[]).includes(type)) filters.type = type as TransactionType;
  if (DATE.test(from)) filters.from = zonedLocalToUtc(`${from}T00:00`, timeZone) ?? undefined;
  if (DATE.test(to)) {
    const end = zonedLocalToUtc(`${to}T23:59`, timeZone);
    if (end) filters.to = new Date(Date.parse(end) + 59_999).toISOString();
  }
  const active = Object.keys(filters).length > 0;
  return { filters, active, raw: { project, asset, type, from, to } };
}
