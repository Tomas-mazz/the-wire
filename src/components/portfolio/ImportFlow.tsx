"use client";

import { startTransition, useActionState, useState, useSyncExternalStore } from "react";
import { Download, FileUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { runImport, type ImportState } from "@/app/[locale]/portfolio/transactions/import/actions";
import { Link } from "@/i18n/navigation";
import type { ReviewRow, ReviewStatus } from "@/lib/import/review";
import { formatDate, formatQuantity, formatUsd } from "@/lib/format";
import Private from "./Private";
import { card, hint, input, label, primaryButton, secondaryButton, tdNumber, th } from "./styles";

interface ImportFlowProps {
  projects: { id: string; name: string }[];
  defaultProjectId: string;
  /** Saved in the profile; null until the first save (the browser's is used). */
  timeZone: string | null;
}

type Preview = Extract<ImportState, { status: "preview" }>;
type Problem = "lookup_failed" | "unresolved" | "no_rate" | "oversell";

const idle: ImportState = { status: "idle" };
const PROBLEMS: Problem[] = ["lookup_failed", "unresolved", "no_rate", "oversell"];

/** The browser's time zone, read without an effect (null while server rendering). */
function useBrowserTimeZone(): string | null {
  return useSyncExternalStore(
    () => () => {},
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null,
  );
}

/** Status pills: amethyst for what will be saved, neutral for the rest (red/green are for gains only). */
const badge: Record<ReviewStatus, string> = {
  new: "border-accent/60 text-accent",
  duplicate: "border-line text-muted",
  unresolved: "border-dashed border-line-strong text-body",
  lookup_failed: "border-dashed border-line-strong text-body",
  no_rate: "border-dashed border-line-strong text-body",
  oversell: "border-dashed border-line-strong text-body",
};

/**
 * M7 import: pick a project and a file, see every row with its status, then
 * confirm. The file stays in the browser between the two steps and is sent
 * again on confirm, so nothing is stored on the server in between.
 */
export default function ImportFlow({ projects, defaultProjectId, timeZone }: ImportFlowProps) {
  const t = useTranslations("Portfolio.import");
  const locale = useLocale();
  const [state, dispatch, pending] = useActionState(runImport.bind(null, locale), idle);

  const [projectId, setProjectId] = useState(defaultProjectId);
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  // What the shown result belongs to: changing the file or project hides it.
  const [sent, setSent] = useState<{ file: File | null; projectId: string; mode: "preview" | "save" } | null>(null);

  const browserTimeZone = useBrowserTimeZone();
  const tz = timeZone ?? browserTimeZone ?? "UTC";
  const current = sent !== null && sent.file === file && sent.projectId === projectId;
  const shown: ImportState = current ? state : idle;
  // Caught here for a quick answer; the server checks the bytes too.
  const unreadable =
    file !== null &&
    (file.type === "application/pdf" ||
      file.type.startsWith("image/") ||
      /\.(pdf|png|jpe?g|heic|webp|gif)$/i.test(file.name));

  function send(mode: "preview" | "save") {
    const form = new FormData();
    if (file) form.set("file", file);
    form.set("projectId", projectId);
    form.set("mode", mode);
    form.set("timeZone", tz);
    setSent({ file, projectId, mode });
    startTransition(() => dispatch(form));
  }

  function startOver() {
    setFile(null);
    setSent(null);
    setInputKey((k) => k + 1);
  }

  if (shown.status === "saved" && !pending) {
    return (
      <section className={`${card} max-w-3xl`} aria-live="polite">
        <h2 className="text-xl font-bold text-fg">{t("title")}</h2>
        <p className="mt-4 text-fg">{t("saved", { count: shown.saved })}</p>
        {shown.partial && <p className="mt-2 text-sm text-muted">{t("savedPartial")}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/portfolio/transactions" className={primaryButton}>
            {t("viewTransactions")}
          </Link>
          <button type="button" onClick={startOver} className={secondaryButton}>
            {t("importAnother")}
          </button>
        </div>
      </section>
    );
  }

  const preview = shown.status === "preview" ? shown : null;

  return (
    <div className="space-y-6">
      <section aria-labelledby="import-title" className={`${card} max-w-3xl`}>
        <h2 id="import-title" className="text-xl font-bold text-fg">
          {t("title")}
        </h2>
        <p className="mt-2 mb-6 text-sm text-muted">{t("intro")}</p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send("preview");
          }}
          className="grid gap-5 sm:grid-cols-2"
        >
          <div>
            <label htmlFor="import-project" className={label}>
              {t("project")}
            </label>
            <select
              id="import-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={input}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="import-file" className={label}>
              {t("file")}
            </label>
            <input
              key={inputKey}
              id="import-file"
              type="file"
              // PDFs and images can be picked so the user gets an explanation instead of a greyed-out file.
              accept=".csv,.txt,.pdf,.png,.jpg,.jpeg,.heic,.webp,text/csv,text/plain,application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              aria-describedby="import-file-hint"
              className={`${input} file:mr-3 file:rounded-lg file:border-0 file:bg-surface-hover file:px-3 file:py-1.5 file:text-sm file:text-fg`}
            />
            <p id="import-file-hint" className={hint}>
              {t("fileHint")}
            </p>
            {unreadable && (
              <p role="alert" className="mt-2 text-sm text-fg">
                {t("errors.unsupported_file")}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={pending || !file || unreadable} className={primaryButton}>
              <FileUp size={16} strokeWidth={1.75} aria-hidden="true" />
              {pending && sent?.mode === "preview" ? t("reviewing") : t("review")}
            </button>
          </div>
        </form>

        {shown.status === "error" && !pending && (
          <p role="alert" className="mt-4 text-sm text-fg">
            {t(`errors.${shown.error}`, { max: 3000 })}
          </p>
        )}

        <details className="mt-6 rounded-xl border border-line px-4 py-3 text-sm">
          <summary className="font-medium text-fg">{t("helpTitle")}</summary>
          <ul className="mt-3 space-y-2 text-body">
            {(["nordnet", "binance", "coinbase", "other"] as const).map((key) => (
              <li key={key}>{t(`help.${key}`)}</li>
            ))}
          </ul>
          <a href="/the-wire-template.csv" download className={`${secondaryButton} mt-4`}>
            <Download size={15} strokeWidth={1.75} aria-hidden="true" />
            {t("templateLink")}
          </a>
          <p className={hint}>{t("templateColumns")}</p>
          <p className={hint}>{t("currencyNote")}</p>
        </details>
      </section>

      {preview && (
        <Review
          preview={preview}
          locale={locale}
          tz={tz}
          pending={pending}
          savingNow={pending && sent?.mode === "save"}
          onConfirm={() => send("save")}
          onReset={startOver}
        />
      )}
    </div>
  );
}

function Review({
  preview,
  locale,
  tz,
  pending,
  savingNow,
  onConfirm,
  onReset,
}: {
  preview: Preview;
  locale: string;
  tz: string;
  pending: boolean;
  savingNow: boolean;
  onConfirm: () => void;
  onReset: () => void;
}) {
  const t = useTranslations("Portfolio.import");
  const tp = useTranslations("Portfolio");
  const counts = new Map<ReviewStatus, number>();
  for (const row of preview.rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  const fresh = counts.get("new") ?? 0;
  const problems = PROBLEMS.filter((s) => counts.get(s));

  return (
    <section aria-labelledby="review-title" className={card}>
      <h2 id="review-title" className="text-lg font-semibold text-fg">
        {t("detected", { broker: t(`brokers.${preview.broker}`), count: preview.rows.length })}
      </h2>

      <ul className="mt-3 flex flex-wrap gap-2 text-xs">
        {(["new", "duplicate", ...PROBLEMS] as const).map((status) =>
          counts.get(status) ? (
            <li key={status} className={`rounded-full border px-2.5 py-1 ${badge[status]}`}>
              {t(`summary.${status}`, { count: counts.get(status)! })}
            </li>
          ) : null,
        )}
        {preview.skipped.length > 0 && (
          <li className="rounded-full border border-line px-2.5 py-1 text-muted">
            {t("summary.skipped", { count: preview.skipped.length })}
          </li>
        )}
        {preview.errors.length > 0 && (
          <li className="rounded-full border border-dashed border-line-strong px-2.5 py-1 text-body">
            {t("summary.errors", { count: preview.errors.length })}
          </li>
        )}
      </ul>

      {problems.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-body">
          {problems.map((s) => (
            <li key={s}>
              <span className="font-medium text-fg">{t(`status.${s}`)}:</span> {t(`statusHelp.${s}`)}
            </li>
          ))}
        </ul>
      )}

      {preview.rows.length > 0 && (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-line bg-bg">
              <tr>
                <th scope="col" className={th}>{t("columns.date")}</th>
                <th scope="col" className={th}>{t("columns.asset")}</th>
                <th scope="col" className={th}>{t("columns.type")}</th>
                <th scope="col" className={`${th} text-right`}>{t("columns.quantity")}</th>
                <th scope="col" className={`${th} text-right`}>{t("columns.price")}</th>
                <th scope="col" className={`${th} text-right`}>{t("columns.fee")}</th>
                <th scope="col" className={th}>{t("columns.status")}</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row) => (
                <ReviewLine key={row.key} row={row} locale={locale} tz={tz} typeLabel={tp(`types.${row.type}`)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {preview.skipped.length > 0 && (
        <details className="mt-5 text-sm">
          <summary className="text-fg">{t("skippedTitle", { count: preview.skipped.length })}</summary>
          <ul className="mt-2 space-y-1 text-body">
            {preview.skipped.map((s) => (
              <li key={s.line}>
                <span className="font-mono text-muted">{s.date ?? "—"}</span> · {s.label} · {t(`skipReasons.${s.reason}`)}
              </li>
            ))}
          </ul>
        </details>
      )}

      {preview.errors.length > 0 && (
        <details open className="mt-4 text-sm">
          <summary className="text-fg">{t("errorsTitle", { count: preview.errors.length })}</summary>
          <ul className="mt-2 space-y-1 text-body">
            {preview.errors.map((e) => (
              <li key={`${e.line}-${e.field}`}>
                {t("errorRow", { line: e.line, field: e.field, problem: t(`problems.${e.code}`) })}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {fresh > 0 ? (
          <button type="button" onClick={onConfirm} disabled={pending} className={primaryButton}>
            {savingNow ? t("saving") : t("confirm", { count: fresh })}
          </button>
        ) : (
          <p className="text-sm text-muted">{t("nothingNew")}</p>
        )}
        <button type="button" onClick={onReset} disabled={pending} className={secondaryButton}>
          {t("chooseOther")}
        </button>
      </div>
    </section>
  );
}

function ReviewLine({ row, locale, tz, typeLabel }: { row: ReviewRow; locale: string; tz: string; typeLabel: string }) {
  const t = useTranslations("Portfolio.import");
  const symbol = row.asset?.symbol;
  return (
    <tr className={`border-b border-line last:border-0 ${row.status === "new" ? "" : "opacity-70"}`}>
      <td className="px-3 py-3 whitespace-nowrap text-body">{formatDate(row.executedAt, locale, tz)}</td>
      <td className="px-3 py-3 whitespace-nowrap">
        {symbol && <span className="font-mono font-semibold text-accent">{symbol}</span>}
        {(!symbol || row.label !== symbol) && (
          <span className={`text-xs text-muted ${symbol ? "ml-2" : ""}`}>{row.label}</span>
        )}
      </td>
      <td className="px-3 py-3 whitespace-nowrap text-body">{typeLabel}</td>
      <td className={tdNumber}>
        <Private>{formatQuantity(row.quantity, locale)}</Private>
      </td>
      <td className={tdNumber}>
        {row.unitPrice ? formatUsd(row.unitPrice, locale) : "—"}
        {row.currency !== "USD" && (
          <span className="block text-[11px] text-muted">{t("converted", { currency: row.currency })}</span>
        )}
      </td>
      <td className={tdNumber}>{row.fee ? <Private>{formatUsd(row.fee, locale)}</Private> : "—"}</td>
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={`rounded-full border px-2 py-0.5 text-xs ${badge[row.status]}`}>{t(`status.${row.status}`)}</span>
      </td>
    </tr>
  );
}
