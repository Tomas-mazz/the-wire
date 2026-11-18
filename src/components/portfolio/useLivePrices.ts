"use client";

import { useEffect, useMemo, useState } from "react";
import { toDec } from "@/domain";
import { BINANCE_STREAM, miniTickerStream } from "@/market-data/binance";
import { POLL_INTERVAL_MS } from "@/market-data/freshness";
import type { PriceSnapshot } from "@/lib/prices/types";

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

/**
 * Live prices for a set of assets (decision 90).
 *  - Crypto: the browser follows Binance's 1-second mini ticker over a
 *    WebSocket (wss://data-stream.binance.vision). Ticks are applied once a
 *    second; the connection reconnects with a growing pause if it drops.
 *  - Everything: every 30 s the page asks /api/prices, which serves the
 *    shared cache and refreshes it (Finnhub for stocks, CoinGecko when
 *    Binance is unavailable). Polling pauses while the tab is hidden.
 *
 * Returns the prices by asset id, "now" (for stale checks), whether the
 * stream is connected, and a setter for manual price edits.
 */
export function useLivePrices(
  assetIds: readonly string[],
  initialPrices: PriceSnapshot[],
  livePairs: Record<string, string>,
  renderedAt: number,
) {
  const [prices, setPrices] = useState<Record<string, PriceSnapshot>>(() => merge({}, initialPrices));
  const [now, setNow] = useState(renderedAt);
  const [live, setLive] = useState(false);
  // Strings, so the effects restart only when the set of ids or pairs changes.
  const idsKey = assetIds.join(",");
  const pairsKey = JSON.stringify(livePairs);
  const ids = useMemo(() => (idsKey ? idsKey.split(",") : []), [idsKey]);

  // Poll the server cache every 30 s while the tab is visible.
  useEffect(() => {
    if (ids.length === 0) return;
    let stopped = false;
    async function poll() {
      setNow(Date.now());
      if (document.hidden) return;
      try {
        const response = await fetch(`/api/prices?ids=${ids.join(",")}`, { cache: "no-store" });
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
  }, [ids]);

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

  return { prices, setPrices, now, live };
}
