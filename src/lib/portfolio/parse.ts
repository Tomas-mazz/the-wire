/**
 * Pure helpers that turn form input into clean values for the database.
 * No React, no network: unit-tested in parse.test.ts.
 */
import { TRANSACTION_TYPES, type TransactionType } from "@/domain";

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

export type NumberError = "required" | "invalid_number" | "ambiguous_number";

export type ParseResult<T, E extends string> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Reads a decimal typed by a person and returns it with a dot ("0,5" → "0.5").
 *
 * Accepts a dot or a comma as decimal separator and no thousands separators.
 * "1.500" or "2,750" are rejected as ambiguous: they could mean 1500 or 1.5,
 * and guessing wrong would silently store the wrong amount.
 */
export function parseDecimalInput(raw: unknown): ParseResult<string, NumberError> {
  const text = typeof raw === "string" ? raw.trim().replace(/\s+/g, "") : "";
  if (text === "") return { ok: false, error: "required" };
  if (!/^(\d{1,20}([.,]\d{0,18})?|[.,]\d{1,18})$/.test(text)) {
    return { ok: false, error: "invalid_number" };
  }
  if (/^[1-9]\d{0,2}[.,]\d{3}$/.test(text)) return { ok: false, error: "ambiguous_number" };

  let value = text.replace(",", ".");
  if (value.startsWith(".")) value = `0${value}`;
  if (value.endsWith(".")) value = value.slice(0, -1);
  // Drop leading zeros ("007" → "7") but keep "0.5".
  value = value.replace(/^0+(?=\d)/, "");
  return { ok: true, value };
}

/** True when a normalized decimal string is greater than zero. */
export function isPositive(value: string): boolean {
  return /[1-9]/.test(value);
}

// ---------------------------------------------------------------------------
// Dates and time zones
// ---------------------------------------------------------------------------

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz === "") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Wall-clock parts of an instant in a time zone. */
function zonedParts(ms: number, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Milliseconds the zone is ahead of UTC at that instant (e.g. +3 600 000 for CET). */
function zoneOffset(ms: number, tz: string): number {
  const p = zonedParts(ms, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(ms / 1000) * 1000;
}

const LOCAL_DATETIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/**
 * Converts the value of an <input type="datetime-local"> ("2026-01-02T10:30"),
 * read as wall-clock time in `tz`, to an ISO string in UTC. Null if invalid.
 */
export function zonedLocalToUtc(local: string, tz: string): string | null {
  const m = LOCAL_DATETIME.exec(local);
  if (!m || !isValidTimeZone(tz)) return null;
  const [year, month, day, hour, minute] = m.slice(1).map(Number);
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(wallAsUtc);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day || hour > 23 || minute > 59) {
    return null;
  }
  // The offset depends on the instant itself (summer time), so correct once.
  let utc = wallAsUtc - zoneOffset(wallAsUtc, tz);
  const second = zoneOffset(utc, tz);
  if (wallAsUtc - second !== utc) utc = wallAsUtc - second;
  return new Date(utc).toISOString();
}

/** The reverse: an ISO instant shown as a datetime-local value in `tz`. */
export function utcToZonedLocal(iso: string, tz: string): string {
  const p = zonedParts(Date.parse(iso), isValidTimeZone(tz) ? tz : "UTC");
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

// ---------------------------------------------------------------------------
// Transaction form
// ---------------------------------------------------------------------------

export const ASSET_CLASSES = ["stock", "etf", "crypto"] as const;
export type UserAssetClass = (typeof ASSET_CLASSES)[number];

export type TransactionField =
  | "projectId"
  | "type"
  | "asset"
  | "symbol"
  | "name"
  | "assetClass"
  | "executedAt"
  | "quantity"
  | "unitPrice"
  | "fee"
  | "broker"
  | "note";

export type FieldError =
  | NumberError
  | "must_be_positive"
  | "invalid"
  | "too_long"
  | "future_date";

export type AssetChoice =
  | { kind: "existing"; assetId: string }
  | { kind: "new"; symbol: string; name: string; assetClass: UserAssetClass }
  /** deposit / withdrawal always move US dollars. */
  | { kind: "cash" };

export interface TransactionInput {
  projectId: string;
  type: TransactionType;
  asset: AssetChoice;
  executedAt: string;
  quantity: string;
  unitPrice: string;
  fee: string | null;
  broker: string | null;
  note: string | null;
}

export type TransactionFormResult =
  | { ok: true; value: TransactionInput }
  | { ok: false; errors: Partial<Record<TransactionField, FieldError>> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Allow a little clock skew, but no trades from the future. */
const FUTURE_TOLERANCE_MS = 24 * 60 * 60 * 1000;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function optionalText(value: string, max: number): ParseResult<string | null, "too_long"> {
  if (value === "") return { ok: true, value: null };
  return value.length > max ? { ok: false, error: "too_long" } : { ok: true, value };
}

/**
 * Validates the transaction form. Mirrors the database constraints so the
 * user sees a clear message instead of a database error.
 *
 * Per type: deposit / withdrawal take an amount in USD (price is 1);
 * reward has no price (it is free); the others need a price.
 */
export function parseTransactionForm(form: FormData, now = Date.now()): TransactionFormResult {
  const errors: Partial<Record<TransactionField, FieldError>> = {};

  const projectId = text(form, "projectId");
  if (!isUuid(projectId)) errors.projectId = "invalid";

  const typeRaw = text(form, "type");
  const type = (TRANSACTION_TYPES as readonly string[]).includes(typeRaw)
    ? (typeRaw as TransactionType)
    : null;
  if (!type) errors.type = "invalid";

  const isCash = type === "deposit" || type === "withdrawal";

  let asset: AssetChoice | null = null;
  if (isCash) {
    asset = { kind: "cash" };
  } else if (text(form, "assetMode") === "new") {
    const symbol = text(form, "symbol").toUpperCase();
    const name = text(form, "name");
    const assetClass = text(form, "assetClass");
    if (!/^[A-Z0-9.\-]{1,20}$/.test(symbol)) errors.symbol = symbol ? "invalid" : "required";
    if (name.length === 0) errors.name = "required";
    else if (name.length > 120) errors.name = "too_long";
    if (!(ASSET_CLASSES as readonly string[]).includes(assetClass)) errors.assetClass = "invalid";
    if (!errors.symbol && !errors.name && !errors.assetClass) {
      asset = { kind: "new", symbol, name, assetClass: assetClass as UserAssetClass };
    }
  } else {
    const assetId = text(form, "assetId");
    if (isUuid(assetId)) asset = { kind: "existing", assetId };
    else errors.asset = "required";
  }

  const tz = text(form, "timeZone");
  const local = text(form, "executedAt");
  const executedAt = local ? zonedLocalToUtc(local, isValidTimeZone(tz) ? tz : "UTC") : null;
  if (!local) errors.executedAt = "required";
  else if (!executedAt) errors.executedAt = "invalid";
  else if (Date.parse(executedAt) > now + FUTURE_TOLERANCE_MS) errors.executedAt = "future_date";

  const quantity = parseDecimalInput(form.get("quantity"));
  if (!quantity.ok) errors.quantity = quantity.error;
  else if (!isPositive(quantity.value)) errors.quantity = "must_be_positive";

  let unitPrice = "0";
  if (isCash) {
    unitPrice = "1";
  } else if (type !== "reward") {
    const price = parseDecimalInput(form.get("unitPrice"));
    if (price.ok) unitPrice = price.value;
    else errors.unitPrice = price.error;
  }

  let fee: string | null = null;
  if (text(form, "fee") !== "") {
    const parsed = parseDecimalInput(form.get("fee"));
    if (parsed.ok) fee = parsed.value;
    else errors.fee = parsed.error;
  }

  const broker = optionalText(text(form, "broker"), 80);
  if (!broker.ok) errors.broker = broker.error;
  const note = optionalText(text(form, "note"), 1000);
  if (!note.ok) errors.note = note.error;

  if (Object.keys(errors).length > 0 || !type || !asset || !executedAt || !quantity.ok) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      projectId,
      type,
      asset,
      executedAt,
      quantity: quantity.value,
      unitPrice,
      fee,
      broker: broker.ok ? broker.value : null,
      note: note.ok ? note.value : null,
    },
  };
}
