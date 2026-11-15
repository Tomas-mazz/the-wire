import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { readSupabaseEnv } from "./env";

/**
 * Refreshes the Supabase session (if the access token expired) and writes the
 * new cookies onto `response`. Returns whether a valid user session exists.
 *
 * Runs once per page request from src/proxy.ts, so pages always see a fresh
 * token. Refresh tokens are single-use, which is why this happens in one place.
 */
export async function refreshSession(
  request: NextRequest,
  response: NextResponse,
): Promise<boolean> {
  const env = readSupabaseEnv();
  // Not configured yet (e.g. a fresh clone): public pages keep working.
  if (!env) return false;

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
        // Cache headers that stop CDNs from serving one user's session to another.
        for (const [header, value] of Object.entries(headers)) {
          response.headers.set(header, value);
        }
      },
    },
  });

  // getClaims() verifies the token signature; never trust getSession() on the server.
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims);
}
