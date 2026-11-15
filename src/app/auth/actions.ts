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
 * Where Supabase sends the user back after they click the email link.
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

export async function signOut(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${safeLocale(locale)}`);
}
