"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import Private from "./Private";
import { usePrivacy } from "./PrivacyToggle";
import { primaryButton, secondaryButton } from "./styles";

interface Props {
  /** Builds the text; called only while the dialog is open. */
  build: (withAmounts: boolean) => string;
  /** "button": labelled button for a section. "icon": small icon for one holding. */
  variant: "button" | "icon";
  /** Accessible name of the opener (e.g. "Copy BTC summary"). */
  label: string;
}

/**
 * "Copy summary" (decision 101): opens a small dialog to choose "with
 * amounts" or "only %", shows the text and copies it. With amounts hidden
 * on screen (decision 100), "only %" is preselected and a text with amounts
 * stays masked in the preview.
 */
export default function ShareSummary({ build, variant, label }: Props) {
  const t = useTranslations("Portfolio.share");
  const hidden = usePrivacy();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [withAmounts, setWithAmounts] = useState(true);
  const [copied, setCopied] = useState<"yes" | "failed" | null>(null);

  function show() {
    setWithAmounts(!hidden);
    setCopied(null);
    setOpen(true);
    dialog.current?.showModal();
  }

  const text = open ? build(withAmounts) : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("yes");
    } catch {
      // No clipboard permission (or an old browser): the text stays visible to copy by hand.
      setCopied("failed");
    }
  }

  return (
    <>
      {variant === "button" ? (
        <button type="button" onClick={show} className={`${secondaryButton} px-3 py-2`}>
          <Copy size={15} strokeWidth={1.75} aria-hidden="true" />
          {label}
        </button>
      ) : (
        <button
          type="button"
          onClick={show}
          aria-label={label}
          title={label}
          className="ml-1.5 inline-flex rounded-md p-1 align-middle text-muted transition-colors hover:text-accent"
        >
          <Copy size={13} strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        aria-labelledby="share-title"
        className="m-auto w-[min(92vw,460px)] rounded-2xl border border-line bg-surface p-5 text-left text-body backdrop:bg-black/70"
      >
        {open && (
          <div className="space-y-4">
            <h2 id="share-title" className="text-base font-semibold text-fg">
              {t("dialogTitle")}
            </h2>

            <div role="group" aria-label={t("formatLabel")} className="inline-flex rounded-full border border-line-strong p-0.5 text-xs">
              {([true, false] as const).map((amounts) => (
                <button
                  key={String(amounts)}
                  type="button"
                  aria-pressed={withAmounts === amounts}
                  onClick={() => {
                    setWithAmounts(amounts);
                    setCopied(null);
                  }}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    withAmounts === amounts ? "bg-accent font-semibold text-accent-ink" : "text-muted hover:text-fg"
                  }`}
                >
                  {t(amounts ? "withAmounts" : "onlyPercent")}
                </button>
              ))}
            </div>

            {withAmounts ? (
              <Private>
                <pre className="max-h-72 overflow-auto rounded-xl border border-line bg-bg p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-fg">
                  {text}
                </pre>
              </Private>
            ) : (
              <pre className="max-h-72 overflow-auto rounded-xl border border-line bg-bg p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-fg">
                {text}
              </pre>
            )}
            {hidden && withAmounts && <p className="text-xs text-muted">{t("hiddenHint")}</p>}
            {copied === "failed" && <p className="text-xs text-down">{t("copyFailed")}</p>}

            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => dialog.current?.close()} className={secondaryButton}>
                {t("close")}
              </button>
              <button type="button" onClick={copy} className={primaryButton}>
                {copied === "yes" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                <span aria-live="polite">{t(copied === "yes" ? "copied" : "copy")}</span>
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
