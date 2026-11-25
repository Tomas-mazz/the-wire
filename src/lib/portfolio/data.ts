import "server-only";
import type { LedgerTransaction, TransactionType } from "@/domain";
import { createClient } from "@/lib/supabase/server";

/*
 * Reads portfolio data for the signed-in user. Row Level Security already
 * limits every query to the user's own rows; the explicit user_id filters
 * only help Postgres use its indexes.
 *
 * Numeric columns are selected as `::text`: PostgREST would otherwise send
 * them as JSON numbers, which JavaScript turns into floats.
 */

export interface Project {
  id: string;
  name: string;
  description: string | null;
  defaultBroker: string | null;
  strategy: string | null;
  horizon: string | null;
  tags: string[];
  trackCash: boolean;
  archivedAt: string | null;
  createdAt: string;
}

export type AssetClass = "stock" | "etf" | "crypto" | "cash";

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
}

export interface TransactionRow {
  id: string;
  projectId: string;
  assetId: string;
  type: TransactionType;
  quantity: string;
  unitPrice: string;
  fee: string | null;
  executedAt: string;
  broker: string | null;
  note: string | null;
  source: "manual" | "csv" | "ai";
  createdAt: string;
  asset: Asset;
}

export interface TransactionFilters {
  projectId?: string;
  assetId?: string;
  type?: TransactionType;
  /** ISO instants (UTC), inclusive. */
  from?: string;
  to?: string;
}

const PROJECT_COLUMNS =
  "id, name, description, default_broker, strategy, horizon, tags, track_cash, archived_at, created_at";

const TRANSACTION_COLUMNS =
  "id, project_id, asset_id, type, quantity::text, unit_price::text, fee::text, executed_at, " +
  "broker, note, source, created_at, asset:assets(id, symbol, name, asset_class)";

/** Most rows a list shows at once (pagination can come later). */
export const TRANSACTION_LIST_LIMIT = 500;

/* eslint-disable @typescript-eslint/no-explicit-any -- rows from the untyped Supabase client */
function toProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    defaultBroker: row.default_broker,
    strategy: row.strategy,
    horizon: row.horizon,
    tags: row.tags ?? [],
    trackCash: row.track_cash,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
  };
}

function toAsset(row: any): Asset {
  return { id: row.id, symbol: row.symbol, name: row.name, assetClass: row.asset_class };
}

function toTransaction(row: any): TransactionRow {
  return {
    id: row.id,
    projectId: row.project_id,
    assetId: row.asset_id,
    type: row.type,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    fee: row.fee,
    executedAt: row.executed_at,
    broker: row.broker,
    note: row.note,
    source: row.source,
    createdAt: row.created_at,
    asset: toAsset(row.asset),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function fail(what: string, error: { message: string }): never {
  throw new Error(`Could not load ${what}: ${error.message}`);
}

/**
 * All projects of the user, oldest first. A user with no projects at all
 * gets one named `defaultName` (decision 80), so a transaction always has
 * somewhere to go.
 */
export async function getProjects(userId: string, defaultName: string): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("user_id", userId)
    .order("created_at");
  if (error) fail("projects", error);
  if (data.length > 0) return data.map(toProject);

  const created = await supabase
    .from("projects")
    .insert({ name: defaultName })
    .select(PROJECT_COLUMNS)
    .single();
  if (created.error) fail("the default project", created.error);
  return [toProject(created.data)];
}

export async function getProject(userId: string, projectId: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("user_id", userId)
    .eq("id", projectId)
    .maybeSingle();
  if (error) fail("the project", error);
  return data ? toProject(data) : null;
}

/** The shared catalogue without cash (cash is chosen by the transaction type). */
export async function getAssets(): Promise<Asset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("id, symbol, name, asset_class")
    .neq("asset_class", "cash")
    .order("symbol")
    .limit(2000);
  if (error) fail("assets", error);
  return data.map(toAsset);
}

/** Newest first, for lists. */
export async function getTransactions(
  userId: string,
  filters: TransactionFilters = {},
  limit = TRANSACTION_LIST_LIMIT,
): Promise<TransactionRow[]> {
  const supabase = await createClient();
  let query = supabase.from("transactions").select(TRANSACTION_COLUMNS).eq("user_id", userId);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  if (filters.assetId) query = query.eq("asset_id", filters.assetId);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.from) query = query.gte("executed_at", filters.from);
  if (filters.to) query = query.lte("executed_at", filters.to);
  const { data, error } = await query
    .order("executed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail("transactions", error);
  return data.map(toTransaction);
}

/**
 * Every transaction matching the filters, for the CSV export. PostgREST
 * returns at most 1000 rows per request, so they are read page by page.
 */
export async function getAllTransactions(userId: string, filters: TransactionFilters = {}): Promise<TransactionRow[]> {
  const PAGE = 1000;
  const supabase = await createClient();
  const rows: TransactionRow[] = [];
  for (let offset = 0; ; offset += PAGE) {
    let query = supabase.from("transactions").select(TRANSACTION_COLUMNS).eq("user_id", userId);
    if (filters.projectId) query = query.eq("project_id", filters.projectId);
    if (filters.assetId) query = query.eq("asset_id", filters.assetId);
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.from) query = query.gte("executed_at", filters.from);
    if (filters.to) query = query.lte("executed_at", filters.to);
    // A stable order (id last) so pages never skip or repeat a row.
    const { data, error } = await query
      .order("executed_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) fail("transactions", error);
    rows.push(...data.map(toTransaction));
    if (data.length < PAGE) return rows;
  }
}

export async function getTransaction(
  userId: string,
  transactionId: string,
): Promise<TransactionRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_COLUMNS)
    .eq("user_id", userId)
    .eq("id", transactionId)
    .maybeSingle();
  if (error) fail("the transaction", error);
  return data ? toTransaction(data) : null;
}

/** Every transaction (optionally of one project) in domain shape, for holdings. */
export async function getLedger(userId: string, projectId?: string): Promise<LedgerTransaction[]> {
  const rows = await getTransactions(userId, projectId ? { projectId } : {}, 10_000);
  return rows.map(toLedger);
}

export function toLedger(row: TransactionRow): LedgerTransaction {
  return {
    id: row.id,
    projectId: row.projectId,
    assetId: row.assetId,
    type: row.type,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    fee: row.fee,
    executedAt: row.executedAt,
    createdAt: row.createdAt,
  };
}

/** The user's saved time zone, or null before the first transaction is saved. */
export async function getTimeZone(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("time_zone")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) fail("the profile", error);
  return data?.time_zone ?? null;
}
