"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { allocation, Dec, summarize, toDec, valuePosition, type Position } from "@/domain";
import { isStale } from "@/market-data/freshness";
import { formatAge, formatPercent, formatQuantity, formatUsd } from "@/lib/format";
import type { PriceSnapshot } from "@/lib/prices/types";
import AllocationDonut from "./AllocationDonut";
import ManualPriceEditor from "./ManualPriceEditor";
import SummaryCards, { type DashboardInfo } from "./SummaryCards";
import { useLivePrices } from "./useLivePrices";
import { tdNumber, th } from "./styles";

/** One holding as plain text, so it can travel from the server to the browser. */
export interface LiveHoldingRow {
  assetId: string;
  symbol: string;
  name: string;
  assetClass: "stock" | "etf" | "crypto";
  quantity: string;
  costBasis: string;
  avgCost: string | null;
  realized: string;
  income: string;
  fees: string;
  invested: string;
}

interface Props {
  rows: LiveHoldingRow[];
  initialPrices: PriceSnapshot[];
  /** Binance pair per crypto asset id, for the live stream. */
  livePairs: Record<string, string>;
  /** Server time of the first render, so server and browser agree on "stale". */
  renderedAt: number;
  /** Set on the section pages: shows the summary cards and the donut. */
  dashboard?: DashboardInfo;
  /** Title shown between the donut and the table. */
  heading?: React.ReactNode;
}

function toPosition(row: LiveHoldingRow): Position {
  return {
    quantity: toDec(row.quantity),
    costBasis: toDec(row.costBasis),
    avgCost: row.avgCost === null ? null : toDec(row.avgCost),
    realized: toDec(row.realized),
    income: toDec(row.income),
    fees: toDec(row.fees),
    invested: toDec(row.invested),
  };
}

/** Signed money or percent: "+"/"−" plus an arrow, never color alone (STYLE.md). */
function Signed({ value, children }: { value: Dec; children: React.ReactNode }) {
  if (value.isZero()) return <span className="text-muted">{children}</span>;
  const up = value.isPositive();
  return (
    <span className={up ? "text-up" : "text-down"}>
      {up ? "▲ +" : "▼ −"}
      {children}
    </span>
  );
}

/**
 * Holdings with live prices (useLivePrices). In a section (Overview, Crypto,
 * Stocks) the summary cards and the allocation donut sit above the table
 * and move with the same prices (M6).
 * All math goes through src/domain with decimal.js; rounding happens only
 * in the formatters.
 */
export default function LiveHoldings({ rows, initialPrices, livePairs, renderedAt, dashboard, heading }: Props) {
  const t = useTranslations("Portfolio");
  const locale = useLocale();
  const pricedIds = useMemo(() => rows.map((r) => r.assetId), [rows]);
  const { prices, setPrices, now, live } = useLivePrices(pricedIds, initialPrices, livePairs, renderedAt);
  const [editing, setEditing] = useState<string | null>(null);

  /** After saving or removing a manual price. */
  function applyManual(assetId: string, price: PriceSnapshot | null) {
    setEditing(null);
    setPrices((current) => {
      const next = { ...current };
      if (price) next[assetId] = price;
      else if (next[assetId]?.source === "manual") delete next[assetId];
      return next;
    });
  }

  const valued = rows.map((row) => {
    const price = prices[row.assetId] ?? null;
    return { row, price, position: valuePosition(toPosition(row), price?.price ?? null) };
  });
  const open = valued.filter((v) => !v.position.quantity.isZero());
  const shares = allocation(valued.map((v) => v.position));
  const totals = summarize(valued.map((v) => v.position));
  const sorted = valued
    .map((v, i) => ({ ...v, share: shares[i] }))
    .sort(
      (a, b) =>
        Number(b.position.quantity.isZero() ? 0 : 1) - Number(a.position.quantity.isZero() ? 0 : 1) ||
        (b.position.marketValue ?? b.position.costBasis).comparedTo(a.position.marketValue ?? a.position.costBasis) ||
        a.row.symbol.localeCompare(b.row.symbol),
    );

  return (
    <div className="space-y-3">
      {dashboard && (
        <div className="mb-10 space-y-3">
          <SummaryCards info={dashboard} valued={valued} totals={totals} />
          <AllocationDonut
            slices={open
              .filter((v) => v.position.marketValue !== null)
              .map((v) => ({
                assetId: v.row.assetId,
                symbol: v.row.symbol,
                name: v.row.name,
                assetClass: v.row.assetClass,
                value: v.position.marketValue!,
              }))}
          />
        </div>
      )}
      {heading}
      <p className="flex items-center gap-2 text-xs text-muted" aria-live="polite">
        {live ? (
          <>
            <span className="size-2 rounded-full bg-up shadow-[0_0_8px_var(--color-up)]" aria-hidden="true" />
            {t("overview.live")}
          </>
        ) : (
          t("overview.polling")
        )}
      </p>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-line bg-surface">
            <tr>
              <th scope="col" className={th}>{t("holdings.asset")}</th>
              <th scope="col" className={`${th} text-right`}>{t("holdings.quantity")}</th>
              <th scope="col" className={`${th} text-right`}>{t("holdings.avgCost")}</th>
              <th scope="col" className={`${th} text-right`}>{t("holdings.price")}</th>
              <th scope="col" className={`${th} text-right`}>{t("holdings.value")}</th>
              <th scope="col" className={`${th} text-right`}>{t("holdings.unrealized")}</th>
              <th scope="col" className={`${th} text-right`}>{t("holdings.allocation")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ row, price, position, share }) => {
              const closed = position.quantity.isZero();
              const manual = price?.source === "manual";
              // A manual price is the user's own figure, so it is never "out of date".
              const stale = price !== null && !manual && isStale(price.asOf, now);
              const linkButton = "text-xs text-accent underline-offset-4 hover:underline";
              return (
                <tr key={row.assetId} className={`border-b border-line last:border-0 ${closed ? "opacity-60" : ""}`}>
                  <th scope="row" className="px-3 py-3 text-left font-normal">
                    <span className="font-mono font-semibold text-accent">{row.symbol}</span>
                    <span className="ml-2 text-muted">{row.name}</span>
                    <span className="ml-2 text-xs text-muted">
                      · {t(`assetClasses.${row.assetClass}`)}
                      {closed && ` · ${t("holdings.closed")}`}
                    </span>
                  </th>
                  <td className={tdNumber}>{formatQuantity(position.quantity, locale)}</td>
                  <td className={tdNumber}>{position.avgCost ? formatUsd(position.avgCost, locale) : "—"}</td>
                  <td className={tdNumber}>
                    {editing === row.assetId ? (
                      <ManualPriceEditor
                        assetId={row.assetId}
                        symbol={row.symbol}
                        current={manual ? price!.price : null}
                        onDone={(p) => applyManual(row.assetId, p)}
                        onCancel={() => setEditing(null)}
                      />
                    ) : price ? (
                      <>
                        <span className={stale ? "text-muted" : undefined}>{formatUsd(price.price, locale)}</span>
                        <span className="block text-xs">
                          {manual ? (
                            <span className="text-muted" title={t("holdings.manualHint")}>
                              ✎ {t("holdings.manual", { age: formatAge(price.asOf, now, locale) })} ·{" "}
                              <button type="button" onClick={() => setEditing(row.assetId)} className={linkButton}>
                                {t("holdings.editPrice")}
                              </button>
                            </span>
                          ) : stale ? (
                            <span className="text-muted" title={t("holdings.staleHint")}>
                              ⚠ {t("holdings.stale", { age: formatAge(price.asOf, now, locale) })}
                            </span>
                          ) : price.dayChangePct !== null ? (
                            <Signed value={toDec(price.dayChangePct)}>
                              {formatPercent(toDec(price.dayChangePct).div(100), locale)}
                              <span className="text-muted"> · {t("holdings.day")}</span>
                            </Signed>
                          ) : null}
                        </span>
                      </>
                    ) : closed ? (
                      "—"
                    ) : (
                      <>
                        <span className="text-muted">{t("holdings.noPrice")}</span>
                        <button
                          type="button"
                          onClick={() => setEditing(row.assetId)}
                          aria-label={t("holdings.setPriceLabel", { symbol: row.symbol })}
                          className={`${linkButton} block w-full text-right`}
                        >
                          {t("holdings.setPrice")}
                        </button>
                      </>
                    )}
                  </td>
                  <td className={tdNumber}>
                    {position.marketValue && !closed ? formatUsd(position.marketValue, locale) : "—"}
                  </td>
                  <td className={tdNumber}>
                    {position.unrealized && !closed ? (
                      <>
                        <Signed value={position.unrealized}>{formatUsd(position.unrealized.abs(), locale)}</Signed>
                        {position.unrealizedPct && (
                          <span className="block text-xs">
                            <Signed value={position.unrealizedPct}>{formatPercent(position.unrealizedPct, locale)}</Signed>
                          </span>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={tdNumber}>{share && !closed ? formatPercent(share, locale) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
          {open.length > 0 && (
            <tfoot className="border-t border-line bg-surface">
              <tr>
                <th scope="row" colSpan={4} className="px-3 py-3 text-left font-semibold text-fg">
                  {t("holdings.total")}
                </th>
                <td className={`${tdNumber} font-semibold text-fg`}>{formatUsd(totals.marketValue, locale)}</td>
                <td className={tdNumber}>
                  <Signed value={totals.unrealized}>{formatUsd(totals.unrealized.abs(), locale)}</Signed>
                  {totals.unrealizedPct && (
                    <span className="block text-xs">
                      <Signed value={totals.unrealizedPct}>{formatPercent(totals.unrealizedPct, locale)}</Signed>
                    </span>
                  )}
                </td>
                <td className={tdNumber}>{totals.marketValue.isZero() ? "—" : formatPercent("1", locale)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-sm text-body">
        {t("overview.summary", {
          realized: `${totals.realized.isNegative() ? "−" : ""}${formatUsd(totals.realized.abs(), locale)}`,
          income: formatUsd(totals.income, locale),
          total: `${totals.totalPnl.isNegative() ? "−" : ""}${formatUsd(totals.totalPnl.abs(), locale)}`,
        })}
      </p>
      {totals.missingPrice > 0 && (
        <p className="text-sm text-muted">{t("overview.missingPrices", { count: totals.missingPrice })}</p>
      )}
      <p className="text-xs text-muted">
        {t.rich("overview.sources", {
          coingecko: (chunks) => (
            <a href="https://www.coingecko.com/en/api" target="_blank" rel="noreferrer" className="text-accent hover:underline">
              {chunks}
            </a>
          ),
        })}
      </p>
    </div>
  );
}
