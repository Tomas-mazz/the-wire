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

/**
 * Summary cards at the top of a section (M6) and their label. On phones three
 * cards share a row with smaller text and News goes below, full width
 * (decision 117); from `lg` the four sit in one row.
 */
export const summaryGrid = "grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4";
export const summaryCard =
  "flex min-h-[96px] min-w-0 flex-col justify-between rounded-2xl border border-line bg-surface p-3 sm:p-4 lg:min-h-[118px]";
export const summaryLabel = "text-[10px] leading-tight font-medium tracking-wide text-muted uppercase sm:text-xs";
/** The News card: its own row on phones, the 4th card from `lg`. */
export const summaryNewsCard = "col-span-3 lg:col-span-1";

/** Grey placeholder block for loading skeletons (pulses unless "reduce motion" is on). */
export const bone = "animate-pulse rounded-md bg-line/45";
