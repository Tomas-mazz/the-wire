import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/*
 * Runs before every page request (Next.js 16 renamed "middleware" to "proxy").
 * next-intl detects the language (cookie → browser Accept-Language → default)
 * and redirects "/" to "/en" or "/es".
 */
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next.js internals and files with an extension (images, favicon…).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
