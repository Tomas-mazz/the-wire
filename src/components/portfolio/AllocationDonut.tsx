"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ZERO, type Dec } from "@/domain";
import { formatPercent, formatUsd, formatUsdCompact } from "@/lib/format";
import { brandColors, OTHERS_COLOR } from "./brandColors";
import Private from "./Private";

export interface DonutSlice {
  assetId: string;
  symbol: string;
  name: string;
  assetClass: string;
  /** Market value of the holding (only priced, open holdings). */
  value: Dec;
}

/** Holdings beyond this many are grouped into one "Others" slice. */
const MAX_SLICES = 8;

/** Circle radius whose circumference is 100, so dash lengths are percents. */
const R = 15.915494;
const STROKE = 3.5;
const STROKE_ACTIVE = 4.6;

interface Part {
  key: string;
  label: string;
  name: string;
  value: Dec;
  share: Dec;
  color: string;
  /** Where the slice starts and how long it is, in % of the circle (drawing only). */
  start: number;
  length: number;
}

/**
 * Allocation donut with a list of bars beside it (decisions 95 and 96).
 * Each holding is drawn in its brand color. Hovering (or tapping, or
 * focusing with the keyboard) a slice or a bar highlights both, dims the
 * rest and shows a label with the symbol, % and value.
 *
 * Beside the performance chart (decision 116) it is compact: the donut on
 * top and the list below, and clicking a holding picks it for the chart
 * (`onSelect`; click it again for the total). "Others" can't be picked.
 *
 *   share = value / Σ value   (exact, with decimal.js; floats only draw the ring)
 */
export default function AllocationDonut({
  slices,
  selected = null,
  onSelect,
}: {
  slices: DonutSlice[];
  selected?: string | null;
  onSelect?: (assetId: string | null) => void;
}) {
  const t = useTranslations("Portfolio.dashboard");
  const locale = useLocale();
  const [hovered, setActive] = useState<string | null>(null);
  // Hover wins; otherwise the holding picked for the chart stays highlighted.
  const active = hovered ?? selected;

  const total = slices.reduce((sum, s) => sum.plus(s.value), ZERO);
  if (slices.length === 0 || total.isZero()) {
    return (
      <section aria-labelledby="allocation-title" className="rounded-3xl border border-line bg-surface p-5">
        <h2 id="allocation-title" className="text-base font-semibold text-fg">{t("allocation")}</h2>
        <p className="mt-3 text-sm text-muted">{t("noAllocation")}</p>
      </section>
    );
  }

  const sorted = [...slices].sort((a, b) => b.value.comparedTo(a.value) || a.symbol.localeCompare(b.symbol));
  const shown = sorted.length > MAX_SLICES ? sorted.slice(0, MAX_SLICES - 1) : sorted;
  const rest = sorted.slice(shown.length);
  const colors = brandColors(shown);

  let start = 0;
  const parts: Part[] = [
    ...shown.map((s, i) => ({ key: s.assetId, label: s.symbol, name: s.name, value: s.value, color: colors[i] })),
    ...(rest.length > 0
      ? [{
          key: "others",
          label: t("others"),
          name: rest.map((s) => s.symbol).join(", "),
          value: rest.reduce((sum, s) => sum.plus(s.value), ZERO),
          color: OTHERS_COLOR,
        }]
      : []),
  ].map((p) => {
    const share = p.value.div(total);
    const length = share.times(100).toNumber();
    const part = { ...p, share, start, length };
    start += length;
    return part;
  });

  // The label only shows while hovering, not for the holding picked for the chart.
  const current = parts.find((p) => p.key === hovered) ?? null;
  // Label position: the middle of the active slice, a bit outside the ring
  // (percent of the box; 0 % of the circle is 12 o'clock, clockwise).
  const angle = current ? ((current.start + current.length / 2) / 100) * 2 * Math.PI : 0;
  const tipLeft = 50 + Math.sin(angle) * 40;
  const tipTop = 50 - Math.cos(angle) * 40;
  const gap = parts.length > 1 ? 0.6 : 0;
  // Tiny holdings still get a visible sliver (drawing only; the % shown stays exact).
  const MIN_DRAWN = 0.8;

  const toggle = (key: string) => {
    if (onSelect && key !== "others") onSelect(selected === key ? null : key);
    else setActive((a) => (a === key ? null : key));
  };

  return (
    <section aria-labelledby="allocation-title" className="rounded-3xl border border-line bg-surface p-5">
      <h2 id="allocation-title" className="mb-4 text-base font-semibold text-fg">{t("allocation")}</h2>
      <div className="flex flex-col items-center gap-6">
        <div className="relative size-40 shrink-0" onMouseLeave={() => setActive(null)}>
          <svg
            viewBox="0 0 42 42"
            className="size-full"
            role="img"
            aria-label={t("allocationLabel", {
              list: parts.map((p) => `${p.label} ${formatPercent(p.share, locale)}`).join(", "),
            })}
          >
            <circle cx="21" cy="21" r={R} fill="none" stroke="var(--color-line)" strokeOpacity={0.5} strokeWidth={STROKE} />
            {parts.map((p) => {
              const on = active === p.key;
              return (
                <circle
                  key={p.key}
                  cx="21"
                  cy="21"
                  r={R}
                  fill="none"
                  stroke={p.color}
                  strokeWidth={on ? STROKE_ACTIVE : STROKE}
                  // Dash = slice length; the offset starts it at 12 o'clock (25 = a quarter turn back).
                  strokeDasharray={`${Math.max(p.length - gap, MIN_DRAWN)} ${100 - Math.max(p.length - gap, MIN_DRAWN)}`}
                  strokeDashoffset={25 - p.start}
                  opacity={active && !on ? 0.35 : 1}
                  className="cursor-pointer transition-[stroke-width,opacity] duration-200"
                  onMouseEnter={() => setActive(p.key)}
                  onClick={() => toggle(p.key)}
                />
              );
            })}
            <text x="21" y="19.6" textAnchor="middle" fontSize="2.6" fill="var(--color-muted)" letterSpacing="0.15">
              {t("total").toUpperCase()}
            </text>
            <text x="21" y="24.6" textAnchor="middle" fontSize="4" fontWeight="600" fill="var(--color-fg)" className="private-svg font-mono">
              {formatUsdCompact(total, locale)}
            </text>
            <text x="21" y="24.6" textAnchor="middle" fontSize="4" fontWeight="600" fill="var(--color-muted)" className="private-svg-alt font-mono">
              ••••••
            </text>
          </svg>
          {current && (
            <div
              role="status"
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+6px)] rounded-lg border border-line-strong bg-accent-ink px-2.5 py-1.5 text-[13px] whitespace-nowrap shadow-[0_6px_20px_rgba(0,0,0,0.5)]"
              style={{ left: `${tipLeft}%`, top: `${tipTop}%` }}
            >
              <span className="mr-1.5 inline-block size-2 rounded-full align-middle" style={{ background: current.color }} />
              <span className="mr-1.5 font-mono font-semibold text-accent">{current.label}</span>
              <span className="font-mono text-fg">{formatPercent(current.share, locale)}</span>
              <span className="font-mono text-muted">
                {" "}
                · <Private>{formatUsd(current.value, locale)}</Private>
              </span>
            </div>
          )}
        </div>

        <ul className="grid w-full min-w-0 gap-1" onMouseLeave={() => setActive(null)}>
          {parts.map((p) => {
            const on = active === p.key;
            return (
              <li key={p.key}>
                <button
                  type="button"
                  title={p.name}
                  aria-pressed={on}
                  onMouseEnter={() => setActive(p.key)}
                  onFocus={() => setActive(p.key)}
                  onBlur={() => setActive(null)}
                  onClick={() => toggle(p.key)}
                  className={`grid w-full grid-cols-[12px_56px_1fr_64px] items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-opacity duration-200 ${
                    active && !on ? "opacity-45" : ""
                  } ${on && selected === p.key ? "bg-surface-hover" : ""}`}
                >
                  <span className="size-3 rounded-full" style={{ background: p.color }} aria-hidden="true" />
                  <span className="truncate font-mono font-semibold text-accent">{p.label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-line/50" aria-hidden="true">
                    <span
                      className="block h-full min-w-1.5 rounded-full"
                      style={{ width: `${p.length}%`, background: p.color }}
                    />
                  </span>
                  <span className="text-right font-mono text-fg">{formatPercent(p.share, locale)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
