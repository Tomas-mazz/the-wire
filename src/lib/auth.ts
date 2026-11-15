import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
}

/**
 * Data Access Layer: the single place that decides who is signed in.
 * Returns the verified user, or redirects to the login page.
 * It reads cookies, so call it inside a <Suspense> boundary.
 */
export async function requireUser(locale: string): Promise<CurrentUser> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims) redirect(`/${locale}/login`);

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
}
