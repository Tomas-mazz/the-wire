import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

/** Only same-site paths that start with a known locale, e.g. "/es/portfolio". */
function safeNext(next: string | null) {
  const locale = next?.split("/")[1] ?? "";
  if (next && next.startsWith("/") && !next.startsWith("//") && hasLocale(routing.locales, locale)) {
    return { path: next, locale };
  }
  return { path: `/${routing.defaultLocale}/portfolio`, locale: routing.defaultLocale };
}

/**
 * Landing point after the magic link email or Google sign-in.
 * - `code`: PKCE flow (Google, or the default email template). Works in the same browser.
 * - `token_hash` + `type`: custom email template. Also works when the email is
 *   opened on another device.
 * On success the session cookies are set and the user goes to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let error: { message: string } | null = { message: "Missing code or token" };

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  }

  if (!error) return NextResponse.redirect(new URL(next.path, origin));

  console.error("Auth callback failed:", error.message);
  return NextResponse.redirect(new URL(`/${next.locale}/login?error=link`, origin));
}
