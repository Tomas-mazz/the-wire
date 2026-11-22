"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { periodChange, priceChange, toDec, ZERO, type Dec, type PeriodChange } from "@/domain";
import { formatDate, formatPercent, formatUsd } from "@/lib/format";
import type { Section } from "@/lib/portfolio/sections";
import Private from "./Private";
import { bone } from "./styles";

/** Range buttons (decision 115): days back from today, or the whole history. */
const RANGES = [
  { key: "1w", days: 7 },
  { key: "1m", days: 30 },
  { key: "3m", days: 90 },
  { key: "1y", days: 365 },
  { key: "all", days: Infinity },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

interface ApiPoint {
  day: string;
  value: string;
  flow: string;
}
interface ApiClose {
  day: string;
  close: string;
}

/** One point of the line, with exact values. */
interface Point {
  day: string;
  value: Dec;
  flow: Dec;
}

type Load<T> = { status: "loading" } | { status: "error" } | { status: "ready"; data: T };

interface Props {
  section: Section;
  /** Holding picked in the allocation list; null shows the section's total. */
  selected: { assetId: string; symbol: string } | null;
  onShowTotal: () => void;
  /** Live market value of the section, so today's point matches the cards. */
  liveTotal: Dec | null;
  /** Live price of the selected holding. */
  livePrice: Dec | null;
}

const W = 600;
const H = 220;

/**
 * Performance chart beside the allocation donut (decisions 113–115).
 * Without a selection it draws the section's value day by day; its change
 * leaves out money put in or taken out (domain periodChange). With a holding
 * picked in the allocation list it draws that asset's market price. The line
 * is green when the period gained and red when it lost. Data comes from
 * /api/history; floats are used only to draw.
 */
export default function PerformanceChart({ section, selected, onShowTotal, liveTotal, livePrice }: Props) {
  const t = useTranslations("Portfolio.dashboard.chart");
  const locale = useLocale();
  const gradientId = useId();
  const [range, setRange] = useState<RangeKey>("1m");
  const [hover, setHover] = useState<number | null>(null);
  const [total, setTotal] = useState<Load<{ points: ApiPoint[]; missing: string[] }>>({ status: "loading" });
  const [assets, setAssets] = useState<Record<string, Load<ApiClose[]>>>({});

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/history?section=${section}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (!cancelled) setTotal({ status: "ready", data });
      })
      .catch(() => {
        if (!cancelled) setTotal({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [section]);

  const assetId = selected?.assetId ?? null;
  // Each holding's history is asked for once; until it arrives it shows as loading.
  const requested = useRef(new Set<string>());
  useEffect(() => {
    if (!assetId || requested.current.has(assetId)) return;
    requested.current.add(assetId);
    fetch(`/api/history?asset=${assetId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => setAssets((a) => ({ ...a, [assetId]: { status: "ready", data: data.closes } })))
      .catch(() => setAssets((a) => ({ ...a, [assetId]: { status: "error" } })));
  }, [assetId]);

  const today = new Date().toISOString().slice(0, 10);
  const load: Load<Point[]> = useMemo(() => {
    if (assetId) {
      const state = assets[assetId] ?? { status: "loading" };
      if (state.status !== "ready") return state;
      const points = state.data.map((c) => ({ day: c.day, value: toDec(c.close), flow: ZERO }));
      // History ends yesterday; today's point is the live price.
      if (livePrice && points.at(-1)?.day !== today) points.push({ day: today, value: livePrice, flow: ZERO });
      return { status: "ready", data: points };
    }
    if (total.status !== "ready") return total;
    const points = total.data.points.map((p) => ({ day: p.day, value: toDec(p.value), flow: toDec(p.flow) }));
    const last = points.at(-1);
    if (last && last.day === today && liveTotal) points[points.length - 1] = { ...last, value: liveTotal };
    return { status: "ready", data: points };
  }, [assetId, assets, livePrice, total, liveTotal, today]);

  const days = RANGES.find((r) => r.key === range)!.days;
  const all = load.status === "ready" ? load.data : [];
  const shown = Number.isFinite(days) ? all.slice(-(days + 1)) : all;
  const change: PeriodChange = assetId ? priceChange(shown.map((p) => ({ close: p.value }))) : periodChange(shown);
  const up = !change.change.isNegative();
  const color = up ? "var(--color-up)" : "var(--color-down)";

  // Drawing only: floats from here on.
  const numbers = shown.map((p) => p.value.toNumber());
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const pad = (max - min) * 0.1 || Math.abs(max) * 0.05 || 1;
  const x = (i: number) => (shown.length > 1 ? (i / (shown.length - 1)) * W : W / 2);
  const y = (v: number) => H - 6 - ((v - (min - pad)) / (max - min + 2 * pad)) * (H - 12);
  const line = numbers.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const focus = hover !== null ? (shown[hover] ?? null) : null;
  const head = focus ?? shown.at(-1) ?? null;

  // Amounts of money are hidden by "Hide amounts"; market prices are not (AGENTS.md).
  const money = (value: Dec) => (assetId ? formatUsd(value, locale) : <Private>{formatUsd(value, locale)}</Private>);
  const missing = !assetId && total.status === "ready" ? total.data.missing : [];

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    if (shown.length < 2) return;
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    setHover(Math.round(ratio * (shown.length - 1)));
  }

  return (
    <section aria-labelledby="chart-title" className="flex min-w-0 flex-col rounded-3xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="chart-title" className="flex flex-wrap items-baseline gap-x-2 text-base font-semibold text-fg">
            {selected ? t("assetTitle", { symbol: selected.symbol }) : t("title")}
            {selected && (
              <button type="button" onClick={onShowTotal} className="text-xs font-normal text-accent hover:underline">
                {t("showTotal")}
              </button>
            )}
          </h2>
          {head && shown.length > 1 && (
            <>
              <p className="mt-1 font-mono text-2xl font-semibold text-fg">{money(head.value)}</p>
              <p className="font-mono text-[13px]" style={{ color: focus ? "var(--color-muted)" : color }}>
                {focus ? (
                  formatDate(`${focus.day}T12:00:00Z`, locale, "UTC")
                ) : (
                  <>
                    {up ? "▲ +" : "▼ −"}
                    {money(change.change.abs())}
                    {change.changePct && ` (${formatPercent(change.changePct, locale)})`}{" "}
                    <span className="text-muted">· {t(`rangeLong.${range}`)}</span>
                  </>
                )}
              </p>
            </>
          )}
        </div>
        <div role="group" aria-label={t("range")} className="flex rounded-xl border border-line-strong p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              aria-pressed={range === r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-[10px] px-2.5 py-1 text-xs font-medium transition-colors ${
                range === r.key ? "bg-accent text-accent-ink" : "text-body hover:text-fg"
              }`}
            >
              {t(`ranges.${r.key}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 min-h-[220px] flex-1">
        {load.status === "loading" && (
          <div role="status" aria-label={t("loading")} className={`${bone} h-[220px] w-full rounded-xl`} />
        )}
        {load.status === "error" && <p className="text-sm text-muted">{t("error")}</p>}
        {load.status === "ready" && shown.length < 2 && <p className="text-sm text-muted">{t("empty")}</p>}
        {load.status === "ready" && shown.length >= 2 && (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="h-[220px] w-full touch-none"
            role="img"
            aria-label={t("label", {
              from: formatDate(`${shown[0].day}T12:00:00Z`, locale, "UTC"),
              to: formatDate(`${shown[shown.length - 1].day}T12:00:00Z`, locale, "UTC"),
            })}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={color} stopOpacity={0.28} />
                <stop offset="1" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            {[1, 2, 3].map((g) => (
              <line
                key={g}
                x1="0"
                x2={W}
                y1={(H / 4) * g}
                y2={(H / 4) * g}
                stroke="var(--color-line)"
                strokeDasharray="2 4"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <path d={`${line}L${W},${H}L0,${H}Z`} fill={`url(#${gradientId})`} />
            <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {focus && hover !== null && (
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1="0"
                y2={H}
                stroke="var(--color-muted)"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
        )}
      </div>
      {missing.length > 0 && <p className="mt-2 text-xs text-muted">{t("missing", { assets: missing.join(", ") })}</p>}
    </section>
  );
}
