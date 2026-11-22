import "server-only";
import { createClient } from "@/lib/supabase/server";
import { countryForZone, listCountries, type CountryChoice } from "./countries";
import { isLocale, type Locale, type SettingsField } from "./parse";

export interface SavedSettings {
  locale: Locale | null;
  country: string | null;
  timeZone: string | null;
}

/** The user's saved language, country and time zone (each null until chosen). */
export async function getSettings(userId: string): Promise<SavedSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("locale, country, time_zone")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Could not load the profile: ${error.message}`);
  return {
    locale: isLocale(data?.locale) ? data.locale : null,
    country: data?.country ?? null,
    timeZone: data?.time_zone ?? null,
  };
}

/**
 * Everything the settings form needs: the countries in `locale` and the
 * values to start from. A missing country is guessed from the saved zone.
 * Call it at request time (after the session check): zone names depend on
 * today's date ("Eastern Time" vs "Eastern Standard Time").
 */
export async function getSettingsForm(
  userId: string,
  locale: Locale,
): Promise<{
  countries: CountryChoice[];
  initial: Record<SettingsField, string>;
}> {
  const saved = await getSettings(userId);
  return {
    countries: listCountries(locale, Date.now(), saved.timeZone),
    initial: {
      locale: saved.locale ?? locale,
      country: saved.country ?? countryForZone(saved.timeZone) ?? "",
      timeZone: saved.timeZone ?? "",
    },
  };
}
