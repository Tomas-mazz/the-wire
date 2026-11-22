/**
 * The cookie next-intl reads to pick the language when someone opens "/"
 * (src/proxy.ts). next-intl sets it for the browser session only; when the
 * language comes from the user's settings it is kept for a year, so the next
 * visit lands in that language (decision 111).
 */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 365,
} as const;
