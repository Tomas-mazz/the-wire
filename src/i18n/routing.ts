import { defineRouting } from "next-intl/routing";

/**
 * Supported languages. Every URL starts with one of them: /en, /es.
 * Visiting "/" redirects to the best match for the browser's language.
 */
export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
});
