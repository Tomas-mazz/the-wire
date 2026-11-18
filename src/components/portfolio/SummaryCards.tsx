"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { bestAndWorst, dayChange, type Dec, type PortfolioTotals, type ValuedPosition } from "@/domain";
import { Link } from "@/i18n/navigation";
import { formatPercent, formatUsd } from "@/lib/format";
import type { PriceSnapshot } from "@/lib/prices/types";
import type { LiveHoldingRow } from "./LiveHoldings";

export type Section = "overview" | "crypto" | "stocks";

/** What a section page passes down for its cards. */
export interface DashboardInfo {
  section: Section;
  /** The most important sample story for the News card (decision 87). */
  news: { title: string } | null;
}

/** One holding with its live price and valuation (from LiveHoldings). */
export interface ValuedRow {
  row: LiveHoldingRow;
  price: PriceSnapshot | null;
  position: ValuedPosition;
}

type Mode = "now" | "total";

/** Text color for a section's result (decision 86): green in profit, red at a loss. */
function toneOf(result: Dec | null): string {
  if (!result || result.isZero()) return "text-fg";
  return result.isPositive() ? "text-up" : "text-down";
}

/**
 * Signed text with an arrow, so the direction never depends on color alone
 * (STYLE.md). The color comes from the section's result, not from here.
 */
function signed(value: Dec, text: string): React.ReactNode {
  if (value.isZero()) return text;
  const up = value.isPositive();
  return (
    <>
      {/* The arrow glyph is large in the monospaced font, so it is drawn smaller. */}
      <span className="mr-1 align-[0.12em] text-[0.6em]" aria-hidden="true">{up ? "▲" : "▼"}</span>
      {up ? "+" : "−"}
      {text}
    </>
  );
}

const cardClass = "flex min-h-[118px] flex-col justify-between rounded-2xl border border-line bg-surface p-4";
const labelClass = "text-xs font-medium tracking-wide text-muted uppercase";
const bigClass = "mt-2.5 font-mono text-xl font-semibold lg:text-2xl";

function Card({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-2">
        <span className={`${labelClass} min-w-0 break-words`}>{label}</span>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}

/** "Now / Total" switch of the P/L cards (decision 93). */
function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  const t = useTranslations("Portfolio.dashboard");
  return (
    <div role="group" aria-label={t("modeLabel")} className="flex shrink-0 rounded-full border border-line-strong p-0.5 text-[11px]">
      {(["now", "total"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => onChange(m)}
          className={`rounded-full px-2 py-0.5 transition-colors ${
            mode === m ? "bg-accent font-semibold text-accent-ink" : "text-muted hover:text-fg"
          }`}
        >
          {t(m === "now" ? "modeNow" : "modeTotal")}
        </button>
      ))}
    </div>
  );
}

/**
 * The row of 4 summary cards at the top of a section (M6, decisions 85–87,
 * 93–95). Every number moves with the live prices of LiveHoldings. All
 * numbers on the cards share one color: the section's result.
 *   Overview: the P/L shown on the P/L card ("Now" or "Total")
 *   Crypto:   BTC price vs BTC average buy price (else the crypto P/L)
 *   Stocks:   the P/L shown on the stocks P/L card
 */
export default function SummaryCards({
  info,
  valued,
  totals,
}: {
  info: DashboardInfo;
  valued: ValuedRow[];
  totals: PortfolioTotals;
}) {
  const t = useTranslations("Portfolio.dashboard");
  const locale = useLocale();
  const [mode, setMode] = useState<Mode>("now");
  const usd = (value: Dec) => formatUsd(value.abs(), locale);
  const pct = (value: Dec) => formatPercent(value, locale);

  const open = valued.filter((v) => !v.position.quantity.isZero());
  const pnl = mode === "now" ? totals.unrealized : totals.totalPnl;
  const pnlPct = mode === "now" ? totals.unrealizedPct : totals.totalPnlPct;

  // BTC for the Crypto section: the open BTC holding, if any.
  const btc = open.find((v) => v.row.assetClass === "crypto" && v.row.symbol.toUpperCase() === "BTC") ?? null;
  const tone = info.section === "crypto" ? toneOf(btc?.position.unrealized ?? totals.unrealized) : toneOf(pnl);

  const valueCard = (label: string) => (
    <Card label={label}>
      <p className={`${bigClass} ${tone}`}>{formatUsd(totals.marketValue, locale)}</p>
      <p className="mt-1 text-xs text-muted">{t("inAssets", { count: open.length })}</p>
    </Card>
  );

  const pnlCard = (label: string) => (
    <Card label={label} action={<ModeSwitch mode={mode} onChange={setMode} />}>
      <p className={`${bigClass} ${tone}`}>{signed(pnl, usd(pnl))}</p>
      <p className={`mt-1 text-xs ${tone}`}>
        {pnlPct ? signed(pnlPct, pct(pnlPct)) : "—"}
        <span className="text-muted"> · {t(mode === "now" ? "nowHint" : "totalHint")}</span>
      </p>
    </Card>
  );

  const empty = (hint: string) => (
    <>
      <p className={`${bigClass} text-muted`}>—</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </>
  );

  let cards: React.ReactNode;
  if (info.section === "overview") {
    const today = dayChange(
      open.map((v) => ({
        quantity: v.position.quantity,
        lastPrice: v.position.lastPrice,
        dayChangePct: v.price?.dayChangePct ?? null,
      })),
    );
    cards = (
      <>
        {valueCard(t("currentValue"))}
        {pnlCard(t("pnl"))}
        <Card label={t("today")}>
          {today.counted === 0 ? (
            empty(t("todayNone"))
          ) : (
            <>
              <p className={`${bigClass} ${tone}`}>{signed(today.change, usd(today.change))}</p>
              <p className={`mt-1 text-xs ${tone}`}>
                {today.changePct ? signed(today.changePct, pct(today.changePct)) : "—"}
              </p>
            </>
          )}
        </Card>
      </>
    );
  } else if (info.section === "crypto") {
    const unrealized = btc?.position.unrealized ?? null;
    const unrealizedPct = btc?.position.unrealizedPct ?? null;
    cards = (
      <>
        <Card label={t("btcAvg")}>
          {btc?.position.avgCost ? (
            <>
              <p className={`${bigClass} ${tone}`}>{formatUsd(btc.position.avgCost, locale)}</p>
              <p className="mt-1 text-xs text-muted">
                {btc.position.lastPrice
                  ? t("btcNow", { price: formatUsd(btc.position.lastPrice, locale) })
                  : t("noPrice")}
              </p>
            </>
          ) : (
            empty(t("noBtc"))
          )}
        </Card>
        <Card label={t("btcPnl")}>
          {unrealized ? (
            <>
              <p className={`${bigClass} ${tone}`}>{signed(unrealized, usd(unrealized))}</p>
              <p className={`mt-1 text-xs ${tone}`}>
                {unrealizedPct ? signed(unrealizedPct, pct(unrealizedPct)) : "—"}
                <span className="text-muted"> · {t("nowHint")}</span>
              </p>
            </>
          ) : (
            empty(btc ? t("noPrice") : t("noBtc"))
          )}
        </Card>
        {valueCard(t("cryptoValue"))}
      </>
    );
  } else {
    const movers = bestAndWorst(open, (v) => v.price?.dayChangePct ?? null);
    const line = (symbol: string, value: Dec) => (
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-mono font-semibold text-accent">{symbol}</span>
        {/* dayChangePct is in percent (1.5 = 1.5 %); formatPercent takes a fraction. */}
        <span className={`font-mono ${tone}`}>{signed(value, pct(value.div(100)))}</span>
      </span>
    );
    cards = (
      <>
        {valueCard(t("stocksValue"))}
        {pnlCard(t("stocksPnl"))}
        <Card label={t("bestWorst")}>
          {movers ? (
            <span className="mt-2.5 block space-y-1 text-sm lg:text-base">
              {line(movers.best.item.row.symbol, movers.best.dayChangePct)}
              {movers.worst.item !== movers.best.item &&
                line(movers.worst.item.row.symbol, movers.worst.dayChangePct)}
            </span>
          ) : (
            empty(t("todayNone"))
          )}
        </Card>
      </>
    );
  }

  return (
    <section aria-label={t("cardsLabel")} className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 lg:grid-cols-4">
      {cards}
      <Link href="/news" className={`${cardClass} glow-card transition-colors hover:bg-surface-hover`}>
        <span className={labelClass}>{t("news")}</span>
        <span>
          <span className="mt-2 line-clamp-2 text-sm leading-snug font-semibold text-fg">
            {info.news?.title ?? t("newsNone")}
          </span>
          <span className="mt-1.5 block text-[13px] text-accent">{t("newsOpen")}</span>
        </span>
      </Link>
    </section>
  );
}
