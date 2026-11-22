import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { LOCALE_COOKIE, LOCALE_COOKIE_OPTIONS } from "@/lib/settings/locale-cookie";
import { isLocale } from "@/lib/settings/parse";
import { createClient } from "@/lib/supabase/server";

/** Only same-site paths that start with a known locale, e.g. "/es/portfolio". */
function safeNext(next: string | null) {
  const locale = next?.split("/")[1] ?? "";
  if (next && next.startsWith("/") && !next.startsWith("//") && hasLocale(routing.locales, locale)) {
    return { path: next, locale };
  }
  return {
    path: `/${routing.defaultLocale}/portfolio`,
    locale: routing.defaultLocale,
  };
}

/**
 * Landing point after the magic link email.
 * - `code`: PKCE flow (default email template). Works in the same browser.
 * - `token_hash` + `type`: custom email template. Also works when the email is
 *   opened on another device.
 * On success the session cookies are set and the user goes to `next`, in the
 * language saved in their settings when there is one (decision 111).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let error: { message: string } | null = { message: "Missing code or token" };

  let userId: string | undefined;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    ({ error } = result);
    userId = result.data.user?.id;
  } else if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    ({ error } = result);
    userId = result.data.user?.id;
  }

  if (!error) {
    const saved = userId ? await savedLocale(supabase, userId) : null;
    if (!saved) return NextResponse.redirect(new URL(next.path, origin));
    // "/en/portfolio" → "/es/portfolio"
    const path = next.path.replace(/^\/[^/]+/, `/${saved}`);
    const response = NextResponse.redirect(new URL(path, origin));
    response.cookies.set(LOCALE_COOKIE, saved, LOCALE_COOKIE_OPTIONS);
    return response;
  }

  console.error("Auth callback failed:", error.message);
  return NextResponse.redirect(new URL(`/${next.locale}/login?error=link`, origin));
}

/** The language in the user's settings, or null (none yet, or the read failed). */
async function savedLocale(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data, error } = await supabase.from("profiles").select("locale").eq("user_id", userId).maybeSingle();
  if (error) console.error("Reading the saved language failed:", error.message);
  return isLocale(data?.locale) ? data.locale : null;
}
