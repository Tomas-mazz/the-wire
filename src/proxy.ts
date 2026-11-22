import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { refreshSession } from "./lib/supabase/proxy";

const handleI18nRouting = createMiddleware(routing);

const locales = routing.locales.join("|");
/** Pages that need a signed-in user, e.g. /es/portfolio, /en/settings. */
const PROTECTED_PATH = new RegExp(
  `^/(${locales})/(?:portfolio|settings)(?:/|$)`,
);
const LOGIN_PATH = new RegExp(`^/(${locales})/login/?$`);

/** Redirect while keeping any refreshed session cookies. */
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

/*
 * Runs before every page request (Next.js 16 renamed "middleware" to "proxy"):
 * 1. next-intl detects the language and redirects "/" to "/en" or "/es".
 * 2. Supabase refreshes the session cookies.
 * 3. Optimistic auth redirects: /portfolio and /settings need a session, /login doesn't make
 *    sense with one. Pages still verify the user themselves (src/lib/auth.ts).
 */
export default async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  if (response.headers.has("location")) return response;

  const isSignedIn = await refreshSession(request, response);
  const { pathname } = request.nextUrl;

  const protectedMatch = pathname.match(PROTECTED_PATH);
  if (protectedMatch && !isSignedIn) {
    return redirectWithCookies(
      new URL(`/${protectedMatch[1]}/login`, request.url),
      response,
    );
  }

  const loginMatch = pathname.match(LOGIN_PATH);
  if (loginMatch && isSignedIn) {
    return redirectWithCookies(
      new URL(`/${loginMatch[1]}/portfolio`, request.url),
      response,
    );
  }

  return response;
}

export const config = {
  // Skip API routes, the auth callback, Next.js internals and files with an extension.
  matcher: "/((?!api|auth|_next|_vercel|.*\\..*).*)",
};
