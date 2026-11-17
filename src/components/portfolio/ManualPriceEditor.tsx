"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { removeManualPrice, saveManualPrice, type ManualPriceResult } from "@/app/[locale]/portfolio/actions";
import type { PriceSnapshot } from "@/lib/prices/types";

interface Props {
  assetId: string;
  symbol: string;
  /** The manual price being edited, or null when adding one. */
  current: string | null;
  onDone: (price: PriceSnapshot | null) => void;
  onCancel: () => void;
}

/**
 * Small inline form in the price cell to type a manual price (decision 91).
 * Saves through a Server Action; the table updates with the returned price.
 */
export default function ManualPriceEditor({ assetId, symbol, current, onDone, onCancel }: Props) {
  const t = useTranslations("Portfolio.holdings");
  const errors = useTranslations("Portfolio.transactionForm.errors");
  const [value, setValue] = useState(current ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handle(result: ManualPriceResult) {
    if (result.status === "ok") return onDone(result.price);
    const code = result.error;
    // Number errors share the transaction form's wording; the rest are specific.
    if (code === "unauthorized" || code === "not_found" || code === "save_failed") {
      setError(t(`manualErrors.${code}`));
    } else {
      setError(errors(code));
    }
  }

  const inputId = `manual-price-${assetId}`;
  return (
    <form
      className="flex flex-col items-end gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => handle(await saveManualPrice(assetId, value)));
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        {t("manualLabel", { symbol })}
      </label>
      <input
        id={inputId}
        inputMode="decimal"
        autoComplete="off"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0,00"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className="w-28 rounded-lg border border-line-strong bg-bg px-2 py-1 text-right font-mono text-sm text-fg focus:border-accent focus:outline-none aria-[invalid=true]:border-down"
      />
      {error && (
        <p id={`${inputId}-error`} className="max-w-48 text-right text-xs whitespace-normal text-down">
          {error}
        </p>
      )}
      <div className="flex gap-2 text-xs">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-2 py-1 font-semibold text-accent-ink disabled:opacity-60"
        >
          {t("save")}
        </button>
        {current !== null && (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => handle(await removeManualPrice(assetId)))}
            className="text-muted hover:text-down"
          >
            {t("remove")}
          </button>
        )}
        <button type="button" onClick={onCancel} className="text-muted hover:text-fg">
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
