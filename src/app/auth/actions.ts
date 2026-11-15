"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

export type EmailSignInState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "invalid" }
  | { status: "error" };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeLocale(locale: string) {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

/**
 * Where Supabase sends the user back after the email link or Google.
 * Server Actions always carry an Origin header that Next.js checks against the
 * host, and Supabase only accepts URLs from its redirect allow-list.
 */
async function callbackUrl(locale: string) {
  const origin = (await headers()).get("origin");
  return `${origin}/auth/callback?next=/${locale}/portfolio`;
}

/** Sends a magic link. The first link for a new email also creates the account. */
export async function signInWithEmail(
  locale: string,
  _previous: EmailSignInState,
  formData: FormData,
): Promise<EmailSignInState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL_PATTERN.test(email)) return { status: "invalid" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: await callbackUrl(safeLocale(locale)) },
  });

  if (error) {
    console.error("Magic link failed:", error.message);
    return { status: "error" };
  }
  return { status: "sent", email };
}

/** Starts the Google sign-in flow and sends the browser to Google. */
export async function signInWithGoogle(locale: string) {
  const lang = safeLocale(locale);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl(lang) },
  });

  if (error || !data.url) {
    console.error("Google sign-in failed:", error?.message);
    redirect(`/${lang}/login?error=google`);
  }
  redirect(data.url);
}

export async function signOut(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${safeLocale(locale)}`);
}
