export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Returns NEXT_PUBLIC_SUPABASE_ANON_KEY, throwing immediately if it's
 * actually a secret/service_role key. Next.js inlines every NEXT_PUBLIC_*
 * value into the browser bundle, so a secret key placed here doesn't just
 * break auth — it ships full-privilege, RLS-bypassing database access to
 * every visitor. Failing loudly here turns that into an immediate build /
 * request failure instead of a silent leak with confusing symptoms (e.g.
 * the header silently failing to recognize a signed-in user).
 */
export function getPublicSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (key.startsWith("sb_secret_")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is set to a secret/service_role key, which gets shipped to " +
        "every visitor's browser. Set it to the publishable (anon) key from Supabase Project " +
        "Settings > API instead, and rotate the leaked secret key immediately."
    );
  }
  return key;
}
