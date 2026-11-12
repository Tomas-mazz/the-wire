"use client";

import { useSyncExternalStore } from "react";
import { useLocale } from "next-intl";

// The date never needs to "update" while the page is open, so subscribe is a no-op.
const subscribe = () => () => {};

// Regional format for each UI language.
const DATE_LOCALES = { en: "en-US", es: "es-ES" } as const;

const formatToday = (locale: keyof typeof DATE_LOCALES) =>
  new Date().toLocaleDateString(DATE_LOCALES[locale], {
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
  const locale = useLocale();
  const today = useSyncExternalStore(subscribe, () => formatToday(locale), () => null);
  return <span>{today ?? " "}</span>;
}
