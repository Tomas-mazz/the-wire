"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  saveSettings,
  type SettingsFormState,
} from "@/app/[locale]/settings/actions";
import {
  fieldError,
  hint,
  input,
  label,
  primaryButton,
} from "@/components/portfolio/styles";
import { routing } from "@/i18n/routing";
import type { CountryChoice } from "@/lib/settings/countries";
import type { SettingsField } from "@/lib/settings/parse";

interface SettingsFormProps {
  countries: CountryChoice[];
  initial: Record<SettingsField, string>;
}

const initialState: SettingsFormState = { status: "idle" };

/**
 * Language, country and time zone, saved with one button (decision 110).
 * Picking a country fills in its time zone; only countries with more than one
 * clock (the US, Spain with the Canaries…) show a time zone list.
 */
export default function SettingsForm({
  countries,
  initial,
}: SettingsFormProps) {
  const t = useTranslations("Settings");
  const pageLocale = useLocale();
  const [state, action, pending] = useActionState(
    saveSettings.bind(null, pageLocale),
    initialState,
  );

  // Controlled fields, so a failed save keeps what was picked.
  const [locale, setLocale] = useState(initial.locale);
  const [countryCode, setCountryCode] = useState(initial.country);
  const country = countries.find((c) => c.code === countryCode);
  const [timeZone, setTimeZone] = useState(
    country?.zones.some((z) => z.id === initial.timeZone)
      ? initial.timeZone
      : (country?.zones[0]?.id ?? ""),
  );

  function chooseCountry(code: string) {
    setCountryCode(code);
    setTimeZone(countries.find((c) => c.code === code)?.zones[0]?.id ?? "");
  }

  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const message = state.status === "error" ? state.message : undefined;
  const error = (name: SettingsField) =>
    errors[name] ? (
      <p id={`${name}-error`} className={fieldError}>
        {t(`errors.${errors[name]}`)}
      </p>
    ) : null;
  const a11y = (name: SettingsField) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form action={action} className="space-y-6" noValidate>
      <div>
        <label htmlFor="locale" className={label}>
          {t("language")}
        </label>
        <select
          id="locale"
          name="locale"
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className={input}
          {...a11y("locale")}
        >
          {routing.locales.map((l) => (
            <option key={l} value={l}>
              {t(`languages.${l}`)}
            </option>
          ))}
        </select>
        <p className={hint}>{t("languageHint")}</p>
        {error("locale")}
      </div>

      <div>
        <label htmlFor="country" className={label}>
          {t("country")}
        </label>
        <select
          id="country"
          name="country"
          value={countryCode}
          onChange={(e) => chooseCountry(e.target.value)}
          className={input}
          {...a11y("country")}
        >
          {!country && <option value="">{t("chooseCountry")}</option>}
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        {error("country")}
      </div>

      {country && country.zones.length > 1 && (
        <div>
          <label htmlFor="timeZone" className={label}>
            {t("timeZone")}
          </label>
          <select
            id="timeZone"
            name="timeZone"
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className={input}
            {...a11y("timeZone")}
          >
            {country.zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
          <p className={hint}>{t("timeZoneHint")}</p>
          {error("timeZone")}
        </div>
      )}

      {country && country.zones.length === 1 && (
        <div>
          <input type="hidden" name="timeZone" value={country.zones[0].id} />
          <p className="text-sm text-body">
            {t("oneTimeZone", {
              country: country.name,
              zone: country.zones[0].label,
            })}
          </p>
          <p className={hint}>{t("timeZoneHint")}</p>
          {error("timeZone")}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? t("saving") : t("save")}
        </button>
        <p
          role="status"
          className={`text-sm ${message ? "text-down" : "text-muted"}`}
        >
          {state.status === "saved"
            ? t("saved")
            : message
              ? t(`errors.${message}`)
              : ""}
        </p>
      </div>
    </form>
  );
}
