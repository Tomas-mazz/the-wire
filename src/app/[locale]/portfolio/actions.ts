"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { computePosition, PortfolioError, type Transaction } from "@/domain";
import { routing } from "@/i18n/routing";
import { getActionUser } from "@/lib/auth";
import {
  isUuid,
  isValidTimeZone,
  parseProjectForm,
  parseTransactionForm,
  type AssetChoice,
  type FieldError,
  type ProjectField,
  type TransactionField,
  type TransactionInput,
} from "@/lib/portfolio/parse";
import { createClient } from "@/lib/supabase/server";

/*
 * Server Actions for projects and transactions. Each one checks the session
 * itself (they can be called by a direct POST), validates the form, and
 * relies on Row Level Security as the last line of defence.
 * `next/root-params` is not available in Server Actions, so the forms pass
 * the locale in (same pattern as src/app/auth/actions.ts).
 */

export type ActionMessage = "unauthorized" | "not_found" | "would_oversell" | "save_failed";

export type FormState<F extends string, E extends string> =
  | { status: "idle" }
  | { status: "saved" }
  | {
      status: "error";
      errors?: Partial<Record<F, E>>;
      message?: ActionMessage;
      /** What the user typed: React 19 resets forms after an action, so they refill from this. */
      values?: Record<string, string>;
    };

export type ProjectFormState = FormState<ProjectField, "required" | "too_long" | "too_many">;
export type TransactionFormState = FormState<TransactionField, FieldError>;

type Supabase = Awaited<ReturnType<typeof createClient>>;

function safeLocale(locale: string) {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

function typed(form: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string" && !key.startsWith("$")) values[key] = value;
  }
  return values;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

function projectRow(input: ReturnType<typeof parseProjectForm> & { ok: true }) {
  const v = input.value;
  return {
    name: v.name,
    description: v.description,
    default_broker: v.defaultBroker,
    strategy: v.strategy,
    horizon: v.horizon,
    tags: v.tags,
    track_cash: v.trackCash,
  };
}

export async function createProject(
  locale: string,
  _previous: ProjectFormState,
  form: FormData,
): Promise<ProjectFormState> {
  const user = await getActionUser();
  if (!user) return { status: "error", message: "unauthorized" };
  const parsed = parseProjectForm(form);
  if (!parsed.ok) return { status: "error", errors: parsed.errors, values: typed(form) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert(projectRow(parsed))
    .select("id")
    .single();
  if (error) {
    console.error("createProject failed:", error.message);
    return { status: "error", message: "save_failed", values: typed(form) };
  }
  redirect(`/${safeLocale(locale)}/portfolio/projects/${data.id}`);
}

export async function updateProject(
  projectId: string,
  _previous: ProjectFormState,
  form: FormData,
): Promise<ProjectFormState> {
  const user = await getActionUser();
  if (!user) return { status: "error", message: "unauthorized" };
  if (!isUuid(projectId)) return { status: "error", message: "not_found" };
  const parsed = parseProjectForm(form);
  if (!parsed.ok) return { status: "error", errors: parsed.errors, values: typed(form) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update(projectRow(parsed))
    .eq("id", projectId)
    .select("id");
  if (error) {
    console.error("updateProject failed:", error.message);
    return { status: "error", message: "save_failed", values: typed(form) };
  }
  if (data.length === 0) return { status: "error", message: "not_found" };
  refresh();
  return { status: "saved" };
}

/** Archive hides a project from forms and lists; nothing is deleted. */
export async function setProjectArchived(projectId: string, archived: boolean): Promise<void> {
  const user = await getActionUser();
  if (!user || !isUuid(projectId)) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", projectId);
  if (error) console.error("setProjectArchived failed:", error.message);
  refresh();
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

/** Finds the asset the form refers to, creating it in the shared catalogue if needed. */
async function resolveAsset(supabase: Supabase, asset: AssetChoice): Promise<string | null> {
  if (asset.kind === "existing") {
    const { data } = await supabase.from("assets").select("id").eq("id", asset.assetId).maybeSingle();
    return data?.id ?? null;
  }

  const wanted =
    asset.kind === "cash"
      ? { symbol: "USD", name: "US Dollar", asset_class: "cash" }
      : { symbol: asset.symbol, name: asset.name, asset_class: asset.assetClass };

  const find = () =>
    supabase
      .from("assets")
      .select("id")
      .eq("asset_class", wanted.asset_class)
      .eq("symbol", wanted.symbol)
      .is("exchange", null)
      .maybeSingle();

  const existing = await find();
  if (existing.data) return existing.data.id;

  const inserted = await supabase.from("assets").insert(wanted).select("id").single();
  if (inserted.data) return inserted.data.id;
  // 23505 = someone added the same asset a moment ago: use theirs.
  if (inserted.error?.code === "23505") return (await find()).data?.id ?? null;
  console.error("resolveAsset failed:", inserted.error?.message);
  return null;
}

/** One project + asset ledger, in domain shape. */
async function loadLedger(
  supabase: Supabase,
  projectId: string,
  assetId: string,
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, quantity::text, unit_price::text, fee::text, executed_at, created_at")
    .eq("project_id", projectId)
    .eq("asset_id", assetId);
  if (error) throw new Error(`Could not load the ledger: ${error.message}`);
  return data.map((r) => ({
    id: r.id,
    type: r.type,
    quantity: r.quantity,
    unitPrice: r.unit_price,
    fee: r.fee,
    executedAt: r.executed_at,
    createdAt: r.created_at,
  }));
}

/**
 * Replays a ledger after a change and reports whether every sell is still
 * covered. Uses the same math as the rest of the app (src/domain).
 */
async function ledgerStaysValid(
  supabase: Supabase,
  projectId: string,
  assetId: string,
  change: (ledger: Transaction[]) => Transaction[],
): Promise<boolean> {
  const ledger = change(await loadLedger(supabase, projectId, assetId));
  try {
    computePosition(ledger);
    return true;
  } catch (error) {
    if (error instanceof PortfolioError && error.code === "sell_exceeds_quantity") return false;
    throw error;
  }
}

/** Saves the browser's time zone the first time, so dates show consistently. */
async function rememberTimeZone(supabase: Supabase, userId: string, form: FormData) {
  const tz = form.get("timeZone");
  if (!isValidTimeZone(tz)) return;
  await supabase.from("profiles").update({ time_zone: tz }).eq("user_id", userId).is("time_zone", null);
}

function transactionRow(input: TransactionInput, assetId: string) {
  return {
    project_id: input.projectId,
    asset_id: assetId,
    type: input.type,
    quantity: input.quantity,
    unit_price: input.unitPrice,
    fee: input.fee,
    executed_at: input.executedAt,
    broker: input.broker,
    note: input.note,
  };
}

/** Creates (transactionId = null) or updates a transaction. */
export async function saveTransaction(
  locale: string,
  transactionId: string | null,
  _previous: TransactionFormState,
  form: FormData,
): Promise<TransactionFormState> {
  const user = await getActionUser();
  if (!user) return { status: "error", message: "unauthorized" };
  if (transactionId !== null && !isUuid(transactionId)) {
    return { status: "error", message: "not_found" };
  }

  const parsed = parseTransactionForm(form);
  if (!parsed.ok) return { status: "error", errors: parsed.errors, values: typed(form) };
  const input = parsed.value;

  const supabase = await createClient();
  await rememberTimeZone(supabase, user.id, form);

  const project = await supabase
    .from("projects")
    .select("id")
    .eq("id", input.projectId)
    .maybeSingle();
  if (!project.data) return { status: "error", errors: { projectId: "invalid" }, values: typed(form) };

  const assetId = await resolveAsset(supabase, input.asset);
  if (!assetId) return { status: "error", errors: { asset: "invalid" }, values: typed(form) };

  let previous: { project_id: string; asset_id: string; created_at: string } | null = null;
  if (transactionId) {
    const { data } = await supabase
      .from("transactions")
      .select("project_id, asset_id, created_at")
      .eq("id", transactionId)
      .maybeSingle();
    if (!data) return { status: "error", message: "not_found" };
    previous = data;
  }

  const candidate: Transaction = {
    id: transactionId ?? "new",
    type: input.type,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    fee: input.fee,
    executedAt: input.executedAt,
    createdAt: previous?.created_at ?? new Date().toISOString(),
  };
  const withoutThis = (ledger: Transaction[]) => ledger.filter((t) => t.id !== transactionId);

  const targetOk = await ledgerStaysValid(supabase, input.projectId, assetId, (ledger) => [
    ...withoutThis(ledger),
    candidate,
  ]);
  const movedAway =
    previous !== null && (previous.project_id !== input.projectId || previous.asset_id !== assetId);
  const sourceOk =
    previous !== null && movedAway
      ? await ledgerStaysValid(supabase, previous.project_id, previous.asset_id, withoutThis)
      : true;
  if (!targetOk || !sourceOk) return { status: "error", message: "would_oversell", values: typed(form) };

  const row = transactionRow(input, assetId);
  const { error } = transactionId
    ? await supabase.from("transactions").update(row).eq("id", transactionId)
    : await supabase.from("transactions").insert({ ...row, source: "manual" });
  if (error) {
    console.error("saveTransaction failed:", error.message);
    return { status: "error", message: "save_failed", values: typed(form) };
  }
  redirect(`/${safeLocale(locale)}/portfolio/transactions`);
}

/** Used with useActionState; the previous state is not needed. */
export async function deleteTransaction(
  locale: string,
  transactionId: string,
): Promise<TransactionFormState> {
  const user = await getActionUser();
  if (!user) return { status: "error", message: "unauthorized" };
  if (!isUuid(transactionId)) return { status: "error", message: "not_found" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("transactions")
    .select("project_id, asset_id")
    .eq("id", transactionId)
    .maybeSingle();
  if (!existing) return { status: "error", message: "not_found" };

  const stillValid = await ledgerStaysValid(
    supabase,
    existing.project_id,
    existing.asset_id,
    (ledger) => ledger.filter((t) => t.id !== transactionId),
  );
  if (!stillValid) return { status: "error", message: "would_oversell" };

  const { error } = await supabase.from("transactions").delete().eq("id", transactionId);
  if (error) {
    console.error("deleteTransaction failed:", error.message);
    return { status: "error", message: "save_failed" };
  }
  redirect(`/${safeLocale(locale)}/portfolio/transactions`);
}
