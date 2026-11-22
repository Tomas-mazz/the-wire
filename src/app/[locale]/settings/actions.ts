"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getActionUser } from "@/lib/auth";
import { LOCALE_COOKIE, LOCALE_COOKIE_OPTIONS } from "@/lib/settings/locale-cookie";
import { isLocale, parseSettings, type SettingsError, type SettingsField } from "@/lib/settings/parse";
import { createClient } from "@/lib/supabase/server";

/*
 * Server Actions for the settings page (decisions 110–112). Like every action
 * they check the session themselves and rely on Row Level Security, and they
 * take the page's locale as an argument (`next/root-params` is not available
 * in actions).
 */

export type SettingsFormState =
  | { status: "idle" }
  | { status: "saved" }
  | {
      status: "error";
      message?: "unauthorized" | "save_failed";
      errors?: Partial<Record<SettingsField, SettingsError>>;
      /** What the user picked, so the form keeps it (React 19 resets forms). */
      values: Record<SettingsField, string>;
    };

/**
 * Saves language, country and time zone. When the language changes the page
 * reloads in the new language, which is the confirmation; otherwise the form
 * shows "Saved".
 */
export async function saveSettings(
  pageLocale: string,
  _previous: SettingsFormState,
  form: FormData,
): Promise<SettingsFormState> {
  const values = {
    locale: String(form.get("locale") ?? ""),
    country: String(form.get("country") ?? ""),
    timeZone: String(form.get("timeZone") ?? ""),
  };
  const user = await getActionUser();
  if (!user) return { status: "error", message: "unauthorized", values };

  const parsed = parseSettings(form);
  if (!parsed.ok) return { status: "error", errors: parsed.errors, values };
  const { locale, country, timeZone } = parsed.value;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ locale, country, time_zone: timeZone })
    .eq("user_id", user.id);
  if (error) {
    console.error("Saving settings failed:", error.message);
    return { status: "error", message: "save_failed", values };
  }

  (await cookies()).set(LOCALE_COOKIE, locale, LOCALE_COOKIE_OPTIONS);
  if (locale !== pageLocale) redirect(`/${locale}/settings`);
  return { status: "saved" };
}

/**
 * Called by the EN | ES switcher in the header: a signed-in user's choice is
 * also their saved language. Does nothing for visitors. It sets no cookie:
 * that would make Next.js refresh the page while the switcher is already
 * navigating (next-intl updates its own cookie on the client).
 */
export async function rememberLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const user = await getActionUser();
  if (!user) return;
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ locale }).eq("user_id", user.id);
  if (error) console.error("Saving the language failed:", error.message);
}
