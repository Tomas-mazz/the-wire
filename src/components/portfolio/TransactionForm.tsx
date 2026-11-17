"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { saveTransaction, type TransactionFormState } from "@/app/[locale]/portfolio/actions";
import { TRANSACTION_TYPES, type TransactionType } from "@/domain";
import { Link } from "@/i18n/navigation";
import type { Asset } from "@/lib/portfolio/data";
import type { AssetCandidate } from "@/market-data/search";
import { ASSET_CLASSES, utcToZonedLocal, type FieldError } from "@/lib/portfolio/parse";
import { fieldError, hint, input, label, primaryButton, secondaryButton } from "./styles";

export interface TransactionFormInitial {
  projectId: string;
  type: TransactionType;
  assetId: string;
  /** datetime-local value in `timeZone`, or "" for "now". */
  executedAt: string;
  quantity: string;
  unitPrice: string;
  fee: string;
  broker: string;
  note: string;
}

interface TransactionFormProps {
  transactionId: string | null;
  projects: { id: string; name: string }[];
  assets: Asset[];
  initial: TransactionFormInitial;
  /** Saved in the profile; null until the first save (the browser's is used). */
  timeZone: string | null;
}

const initialState: TransactionFormState = { status: "idle" };
const MAX_MATCHES = 8;

/** The browser's time zone, read without an effect (null while server rendering). */
function useBrowserTimeZone(): string | null {
  return useSyncExternalStore(
    () => () => {},
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null,
  );
}

export default function TransactionForm({
  transactionId,
  projects,
  assets,
  initial,
  timeZone,
}: TransactionFormProps) {
  const t = useTranslations("Portfolio");
  const f = useTranslations("Portfolio.transactionForm");
  const locale = useLocale();
  const [state, action, pending] = useActionState(
    saveTransaction.bind(null, locale, transactionId),
    initialState,
  );

  const typed = state.status === "error" ? state.values : undefined;
  const errors: Partial<Record<string, FieldError>> =
    state.status === "error" ? (state.errors ?? {}) : {};

  const [type, setType] = useState<TransactionType>(initial.type);
  const [assetMode, setAssetMode] = useState<"existing" | "new">("existing");
  const [assetId, setAssetId] = useState(initial.assetId);
  const [query, setQuery] = useState("");
  const [newSymbol, setNewSymbol] = useState("");
  // A result picked from the provider search pre-fills the "new asset" fields.
  const [picked, setPicked] = useState<AssetCandidate | null>(null);
  const [remote, setRemote] = useState<{ query: string; results: AssetCandidate[] }>({ query: "", results: [] });
  const [searching, setSearching] = useState(false);

  const browserTimeZone = useBrowserTimeZone();
  const tz = timeZone ?? browserTimeZone ?? "UTC";

  // A new transaction starts at "now" in the user's time zone. Set on the
  // client only, so server and browser render the same HTML.
  const dateRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (dateRef.current && dateRef.current.value === "") {
      dateRef.current.value = utcToZonedLocal(new Date().toISOString(), tz);
    }
  }, [tz]);

  const isCash = type === "deposit" || type === "withdrawal";
  const isReward = type === "reward";
  const isDividend = type === "dividend";

  const selected = assets.find((a) => a.id === assetId) ?? null;
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return assets.slice(0, MAX_MATCHES);
    return assets
      .filter((a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
      .sort((a, b) => Number(b.symbol.toLowerCase() === q) - Number(a.symbol.toLowerCase() === q))
      .slice(0, MAX_MATCHES);
  }, [assets, query]);

  // Ask the providers (Finnhub + CoinGecko) 350 ms after the user stops typing.
  const remoteQuery = query.trim();
  useEffect(() => {
    if (remoteQuery.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/assets/search?q=${encodeURIComponent(remoteQuery)}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const body = (await response.json()) as { results: AssetCandidate[] };
          setRemote({ query: remoteQuery, results: body.results });
        }
      } catch {
        // Aborted or offline: the catalogue results are still there.
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [remoteQuery]);

  // Provider results not already in the catalogue (same symbol and kind).
  const known = new Set(assets.map((a) => `${a.assetClass}|${a.symbol}`));
  const remoteMatches =
    remote.query === remoteQuery
      ? remote.results.filter((c) => !known.has(`${c.assetClass}|${c.symbol}`))
      : [];

  const value = (name: keyof TransactionFormInitial) => typed?.[name] ?? initial[name];
  const error = (name: string) =>
    errors[name] ? (
      <p id={`${name}-error`} className={fieldError}>
        {f(`errors.${errors[name]}`)}
      </p>
    ) : null;
  const a11y = (name: string) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="timeZone" value={tz} />
      <input type="hidden" name="assetMode" value={assetMode} />
      <input type="hidden" name="assetId" value={assetMode === "existing" ? assetId : ""} />

      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-xl border border-down/40 px-4 py-3 text-sm text-down">
          {f(`messages.${state.message}`)}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className={label}>
            {f("type")}
          </label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
            className={input}
            {...a11y("type")}
          >
            {TRANSACTION_TYPES.map((tt) => (
              <option key={tt} value={tt}>
                {t(`types.${tt}`)}
              </option>
            ))}
          </select>
          {error("type")}
        </div>

        <div>
          <label htmlFor="projectId" className={label}>
            {f("project")}
          </label>
          <select
            id="projectId"
            name="projectId"
            defaultValue={value("projectId")}
            className={input}
            {...a11y("projectId")}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {error("projectId")}
        </div>
      </div>

      {!isCash && (
        <fieldset className="space-y-3">
          <legend className={label}>{f("asset")}</legend>

          {assetMode === "existing" && selected && (
            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-line-strong bg-bg px-3 py-2.5">
              <span>
                <span className="font-mono font-semibold text-accent">{selected.symbol}</span>
                <span className="ml-2 text-sm text-muted">
                  {selected.name} · {t(`assetClasses.${selected.assetClass}`)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setAssetId("")}
                className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
              >
                <X size={14} strokeWidth={1.5} aria-hidden="true" />
                {f("change")}
              </button>
            </div>
          )}

          {assetMode === "existing" && !selected && (
            <div>
              <label htmlFor="assetSearch" className="sr-only">
                {f("searchAsset")}
              </label>
              <input
                id="assetSearch"
                type="search"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={f("searchAsset")}
                className={input}
                {...a11y("asset")}
              />
              {error("asset")}
              {matches.length > 0 ? (
                <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line">
                  {matches.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setAssetId(a.id)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-surface-hover"
                      >
                        <span className="font-mono font-semibold text-accent">{a.symbol}</span>
                        <span className="truncate text-sm text-muted">{a.name}</span>
                        <span className="ml-auto text-xs text-muted">
                          {t(`assetClasses.${a.assetClass}`)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={hint}>{f("noMatches")}</p>
              )}
              {remoteQuery.length >= 2 && (
                <div className="mt-3" aria-live="polite">
                  <p className={`${hint} mb-2`}>{searching ? f("searchingProviders") : f("fromProviders")}</p>
                  {remoteMatches.length > 0 && (
                    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                      {remoteMatches.map((c) => (
                        <li key={`${c.assetClass}|${c.symbol}|${Object.values(c.providerRefs)[0]}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setPicked(c);
                              setNewSymbol(c.symbol);
                              setAssetMode("new");
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-surface-hover"
                          >
                            <span className="font-mono font-semibold text-accent">{c.symbol}</span>
                            <span className="truncate text-sm text-muted">{c.name}</span>
                            <span className="ml-auto text-xs text-muted">{t(`assetClasses.${c.assetClass}`)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!searching && remoteMatches.length === 0 && remote.query === remoteQuery && (
                    <p className={hint}>{f("noProviderMatches")}</p>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setPicked(null);
                  setNewSymbol(query.trim().toUpperCase());
                  setAssetMode("new");
                }}
                className="mt-3 text-sm text-accent underline-offset-4 hover:underline"
              >
                {f("addNew")}
              </button>
            </div>
          )}

          {assetMode === "new" && (
            <div
              // Remount when another search result is picked, so the defaults refresh.
              key={picked ? `${picked.assetClass}|${picked.symbol}` : "manual"}
              className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-3"
            >
              <input type="hidden" name="providerRefs" value={picked ? JSON.stringify(picked.providerRefs) : ""} />
              {picked && <p className={`${hint} mt-0 sm:col-span-3`}>{f("pickedFromProvider")}</p>}
              <div>
                <label htmlFor="symbol" className={label}>
                  {f("symbol")}
                </label>
                <input
                  id="symbol"
                  name="symbol"
                  autoComplete="off"
                  maxLength={20}
                  placeholder={f("symbolPlaceholder")}
                  defaultValue={typed?.symbol ?? newSymbol}
                  className={`${input} font-mono uppercase`}
                  {...a11y("symbol")}
                />
                {error("symbol")}
              </div>
              <div>
                <label htmlFor="name" className={label}>
                  {f("name")}
                </label>
                <input
                  id="name"
                  name="name"
                  maxLength={120}
                  placeholder={f("namePlaceholder")}
                  defaultValue={typed?.name ?? picked?.name ?? ""}
                  className={input}
                  {...a11y("name")}
                />
                {error("name")}
              </div>
              <div>
                <label htmlFor="assetClass" className={label}>
                  {f("assetClass")}
                </label>
                <select
                  id="assetClass"
                  name="assetClass"
                  defaultValue={typed?.assetClass ?? picked?.assetClass ?? "crypto"}
                  className={input}
                  {...a11y("assetClass")}
                >
                  {ASSET_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {t(`assetClasses.${c}`)}
                    </option>
                  ))}
                </select>
                {error("assetClass")}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPicked(null);
                  setAssetMode("existing");
                }}
                className="text-left text-sm text-muted hover:text-fg sm:col-span-3"
              >
                {f("chooseExisting")}
              </button>
            </div>
          )}
        </fieldset>
      )}

      <div>
        <label htmlFor="executedAt" className={label}>
          {f("date")}
        </label>
        <input
          ref={dateRef}
          id="executedAt"
          name="executedAt"
          type="datetime-local"
          defaultValue={value("executedAt")}
          className={`${input} sm:max-w-xs`}
          {...a11y("executedAt")}
        />
        <p className={hint}>{f("timeZoneNote", { timeZone: tz })}</p>
        {error("executedAt")}
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <label htmlFor="quantity" className={label}>
            {isCash ? f("amount") : isDividend ? f("shares") : f("quantity")}
          </label>
          <input
            id="quantity"
            name="quantity"
            inputMode="decimal"
            autoComplete="off"
            defaultValue={value("quantity")}
            className={`${input} font-mono`}
            {...a11y("quantity")}
          />
          {error("quantity")}
        </div>

        {!isCash && !isReward && (
          <div>
            <label htmlFor="unitPrice" className={label}>
              {isDividend ? f("perShare") : f("unitPrice")}
            </label>
            <input
              id="unitPrice"
              name="unitPrice"
              inputMode="decimal"
              autoComplete="off"
              defaultValue={value("unitPrice")}
              className={`${input} font-mono`}
              {...a11y("unitPrice")}
            />
            {error("unitPrice")}
          </div>
        )}

        <div>
          <label htmlFor="fee" className={label}>
            {isDividend ? f("withholding") : f("fee")}{" "}
            <span className="normal-case">({f("optional")})</span>
          </label>
          <input
            id="fee"
            name="fee"
            inputMode="decimal"
            autoComplete="off"
            defaultValue={value("fee")}
            className={`${input} font-mono`}
            {...a11y("fee")}
          />
          {error("fee")}
        </div>
      </div>
      <p className="-mt-3 text-xs text-muted">
        {isReward ? `${f("rewardHint")} ` : ""}
        {f("decimalHint")}
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="broker" className={label}>
            {f("broker")} <span className="normal-case">({f("optional")})</span>
          </label>
          <input
            id="broker"
            name="broker"
            maxLength={80}
            defaultValue={value("broker")}
            className={input}
            {...a11y("broker")}
          />
          {error("broker")}
        </div>
        <div>
          <label htmlFor="note" className={label}>
            {f("note")} <span className="normal-case">({f("optional")})</span>
          </label>
          <input
            id="note"
            name="note"
            maxLength={1000}
            defaultValue={value("note")}
            className={input}
            {...a11y("note")}
          />
          {error("note")}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? f("saving") : f("save")}
        </button>
        <Link href="/portfolio/transactions" className={secondaryButton}>
          {f("cancel")}
        </Link>
      </div>
    </form>
  );
}
