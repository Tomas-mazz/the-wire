import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "./supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
}

/**
 * Data Access Layer: the single place that decides who is signed in.
 * Returns the verified user, or null when signed out.
 * It reads cookies, so call it inside a <Suspense> boundary.
 */
export async function getOptionalUser(): Promise<CurrentUser | null> {
  // Checking the token expiry reads the current time, which Next.js doesn't
  // allow while prerendering. connection() makes this run at request time.
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims) return null;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
}

/** Like getOptionalUser, but redirects to the login page when signed out. */
export async function requireUser(locale: string): Promise<CurrentUser> {
  const user = await getOptionalUser();
  if (!user) redirect(`/${locale}/login`);
  return user;
}
