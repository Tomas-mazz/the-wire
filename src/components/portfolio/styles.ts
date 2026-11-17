/** Shared Tailwind classes for the portfolio screens (tokens from STYLE.md). */

export const card = "rounded-2xl border border-line bg-surface p-5 sm:p-6";

export const label = "block text-[13px] font-medium tracking-wide text-muted uppercase";

export const input =
  "mt-2 w-full rounded-xl border border-line-strong bg-bg px-3 py-2.5 text-fg placeholder:text-muted focus:border-accent focus:outline-none aria-[invalid=true]:border-down";

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-60";

export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong px-4 py-2.5 text-sm text-fg transition-colors hover:border-accent hover:bg-surface-hover disabled:opacity-60";

export const fieldError = "mt-1.5 text-sm text-down";

export const hint = "mt-1.5 text-xs text-muted";

/** Table header cell. */
export const th = "px-3 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-muted uppercase";

/** Numeric cell: monospaced, right aligned. */
export const tdNumber = "px-3 py-3 text-right font-mono whitespace-nowrap text-body";
