"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { allocation, Dec, summarize, toDec, valuePosition, type Position } from "@/domain";
import { BINANCE_STREAM, miniTickerStream } from "@/market-data/binance";
import { isStale, POLL_INTERVAL_MS } from "@/market-data/freshness";
import { formatAge, formatPercent, formatQuantity, formatUsd } from "@/lib/format";
import type { PriceSnapshot } from "@/lib/prices/types";
import ManualPriceEditor from "./ManualPriceEditor";
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

/** Keeps whichever price is newer (a live tick or the server cache). */
function merge(current: Record<string, PriceSnapshot>, incoming: PriceSnapshot[]) {
  let changed = false;
  const next = { ...current };
  for (const price of incoming) {
    const old = next[price.assetId];
    if (!old || Date.parse(price.asOf) >= Date.parse(old.asOf)) {
      next[price.assetId] = price;
      changed = true;
    }
  }
  return changed ? next : current;
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
 * Holdings with live prices (decision 90).
 *  - Crypto: the browser follows Binance's 1-second mini ticker over a
 *    WebSocket (wss://data-stream.binance.vision). Ticks are applied once a
 *    second; the connection reconnects with a growing pause if it drops.
 *  - Everything: every 30 s the page asks /api/prices, which serves the
 *    shared cache and refreshes it (Finnhub for stocks, CoinGecko when
 *    Binance is unavailable). Polling pauses while the tab is hidden.
 * All math goes through src/domain with decimal.js; rounding happens only
 * in the formatters.
 */
export default function LiveHoldings({ rows, initialPrices, livePairs, renderedAt }: Props) {
  const t = useTranslations("Portfolio");
  const locale = useLocale();
  const [prices, setPrices] = useState<Record<string, PriceSnapshot>>(() =>
    merge({}, initialPrices),
  );
  const [now, setNow] = useState(renderedAt);
  const [live, setLive] = useState(false);
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
  const pricedIds = useMemo(() => rows.map((r) => r.assetId), [rows]);
  // A string, so the stream reconnects only when the set of pairs changes.
  const pairsKey = JSON.stringify(livePairs);

  // Poll the server cache every 30 s while the tab is visible.
  useEffect(() => {
    if (pricedIds.length === 0) return;
    let stopped = false;
    async function poll() {
      setNow(Date.now());
      if (document.hidden) return;
      try {
        const response = await fetch(`/api/prices?ids=${pricedIds.join(",")}`, { cache: "no-store" });
        if (response.status === 401) {
          stopped = true;
          return;
        }
        if (!response.ok) return;
        const body = (await response.json()) as { prices: PriceSnapshot[] };
        setPrices((current) => merge(current, body.prices));
      } catch {
        // Offline or the server is busy: keep the last prices; they turn "stale" with time.
      }
    }
    const timer = setInterval(() => {
      if (!stopped) void poll();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [pricedIds]);

  // Live crypto prices from Binance.
  useEffect(() => {
    const pairs = JSON.parse(pairsKey) as Record<string, string>;
    const idsByPair = new Map<string, string[]>();
    for (const [assetId, pair] of Object.entries(pairs)) {
      idsByPair.set(pair, [...(idsByPair.get(pair) ?? []), assetId]);
    }
    if (idsByPair.size === 0) return;

    const url = `${BINANCE_STREAM}/stream?streams=${[...idsByPair.keys()].map(miniTickerStream).join("/")}`;
    const pending = new Map<string, { close: string; open: string }>();
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let closedByUs = false;

    function connect() {
      socket = new WebSocket(url);
      socket.onopen = () => {
        attempts = 0;
        setLive(true);
      };
      socket.onmessage = (event) => {
        try {
          // Combined stream payload: { stream, data: { s, c (last), o (open 24 h ago), ... } }
          const { data } = JSON.parse(String(event.data)) as {
            data?: { s?: unknown; c?: unknown; o?: unknown };
          };
          if (data && typeof data.s === "string" && typeof data.c === "string" && typeof data.o === "string") {
            pending.set(data.s, { close: data.c, open: data.o });
          }
        } catch {
          // Ignore a malformed message.
        }
      };
      socket.onclose = () => {
        setLive(false);
        if (closedByUs) return;
        // Binance closes every connection after 24 h; network drops happen too.
        retryTimer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** attempts++));
      };
      socket.onerror = () => socket?.close();
    }

    // Apply the ticks gathered in the last second in one render.
    const flush = setInterval(() => {
      if (pending.size === 0) return;
      const asOf = new Date().toISOString();
      const ticks: PriceSnapshot[] = [];
      for (const [pair, { close, open }] of pending) {
        const last = toDec(close);
        const first = toDec(open);
        if (last.isZero()) continue;
        // 24 h change in percent: (last − open) / open × 100, like Binance's own figure.
        const dayChangePct = first.isZero() ? null : last.minus(first).div(first).times(100).toFixed();
        for (const assetId of idsByPair.get(pair) ?? []) {
          ticks.push({ assetId, price: close, dayChangePct, asOf, source: "binance" });
        }
      }
      pending.clear();
      setNow(Date.now());
      setPrices((current) => merge(current, ticks));
    }, 1000);

    connect();
    return () => {
      closedByUs = true;
      clearInterval(flush);
      clearTimeout(retryTimer);
      socket?.close();
    };
  }, [pairsKey]);

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
