/**
 * Supabase connection settings. Both values are public by design (the
 * publishable key only allows what Row Level Security permits), so the
 * NEXT_PUBLIC_ prefix is fine. Set them in .env.local and in Vercel.
 */
export function readSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

export function getSupabaseEnv(): { url: string; key: string } {
  const env = readSupabaseEnv();
  if (!env) {
    throw new Error(
      "Missing Supabase settings: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example).",
    );
  }
  return env;
}
