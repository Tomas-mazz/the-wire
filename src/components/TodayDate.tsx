"use client";

import { useSyncExternalStore } from "react";

// The date never needs to "update" while the page is open, so subscribe is a no-op.
const subscribe = () => () => {};

const formatToday = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

/**
 * Today's date, computed in the visitor's browser.
 * The page is prerendered at build time, so a server-side date would be stale.
 * During prerender and hydration getServerSnapshot returns null; React then
 * re-renders with the browser's value, so there is no hydration mismatch.
 */
export default function TodayDate() {
  const today = useSyncExternalStore(subscribe, formatToday, () => null);
  return <span>{today ?? " "}</span>;
}
