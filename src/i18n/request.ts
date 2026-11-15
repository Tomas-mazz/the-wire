import { locale as rootLocale } from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Loads the UI strings (messages/<locale>.json) for each request.
 * The locale comes from the [locale] root segment via next/root-params, so
 * pages don't need to read `params` (which would block instant navigation).
 * An explicit locale, e.g. getTranslations({ locale: "en" }), takes priority.
 */
export default getRequestConfig(async ({ locale: explicit }) => {
  const requested = explicit ?? (await rootLocale());
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
