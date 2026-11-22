/**
 * Pure parsing of the settings form (decision 112). No React, no network:
 * unit-tested in parse.test.ts.
 */
import { routing } from "@/i18n/routing";
import { zoneBelongsTo } from "./countries";

export type Locale = (typeof routing.locales)[number];

export interface Settings {
  locale: Locale;
  /** ISO 3166-1 alpha-2, e.g. "DK". */
  country: string;
  /** IANA name, e.g. "Europe/Copenhagen". */
  timeZone: string;
}

export type SettingsField = keyof Settings;
export type SettingsError = "required" | "invalid";

export type SettingsParse =
  | { ok: true; value: Settings }
  | { ok: false; errors: Partial<Record<SettingsField, SettingsError>> };

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (routing.locales as readonly string[]).includes(value)
  );
}

/** Checks the language, the country and that the time zone is one of that country's. */
export function parseSettings(form: {
  get(name: string): unknown;
}): SettingsParse {
  const text = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value.trim() : "";
  };
  const locale = text("locale");
  const country = text("country").toUpperCase();
  const timeZone = text("timeZone");
  const errors: Partial<Record<SettingsField, SettingsError>> = {};

  if (!locale) errors.locale = "required";
  else if (!isLocale(locale)) errors.locale = "invalid";

  if (!country) errors.country = "required";
  else if (!/^[A-Z]{2}$/.test(country)) errors.country = "invalid";

  if (!timeZone) errors.timeZone = "required";
  else if (!errors.country && !zoneBelongsTo(timeZone, country))
    errors.timeZone = "invalid";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { locale: locale as Locale, country, timeZone } };
}
