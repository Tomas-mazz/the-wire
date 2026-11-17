import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readSupabaseEnv } from "./env";

/**
 * Supabase client with the SECRET key, for server code only.
 *
 * The secret key acts as the `service_role` Postgres role, which skips Row
 * Level Security, so it is used for one job: writing the shared price cache
 * (`latest_prices`), which users may read but never write. It must never
 * reach the browser, a NEXT_PUBLIC_ variable or git (Supabase docs: API keys).
 *
 * Returns null when SUPABASE_SECRET_KEY is not set: prices still show, they
 * just are not cached.
 */
let admin: SupabaseClient | null | undefined;

export function getAdminClient(): SupabaseClient | null {
  if (admin !== undefined) return admin;
  const env = readSupabaseEnv();
  const secret = process.env.SUPABASE_SECRET_KEY;
  admin =
    env && secret
      ? createClient(env.url, secret, {
          // No user session lives in this client.
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        })
      : null;
  return admin;
}
