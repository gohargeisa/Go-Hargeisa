export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

const NEW_FORMAT_PUBLISHABLE_PREFIX = "sb_publishable_";
const NEW_FORMAT_SECRET_PREFIX = "sb_secret_";

/**
 * Decodes the `role` claim from a legacy (pre-2024) Supabase API key, which
 * is a plain JWT (`header.payload.signature`). Returns null if `token`
 * isn't a well-formed JWT with a string `role` claim — callers treat that
 * as "not a recognizable key" rather than trying to guess further. Uses
 * atob/JSON.parse only (no Buffer) so this also works in the Edge runtime,
 * since lib/supabase/middleware.ts calls getPublicSupabaseAnonKey() from
 * the root middleware.
 */
function legacyKeyRole(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

/**
 * Returns NEXT_PUBLIC_SUPABASE_ANON_KEY, throwing immediately if it isn't a
 * publishable/anon key. Next.js inlines every NEXT_PUBLIC_* value into the
 * browser bundle, so any other kind of key placed here — a new-format
 * `sb_secret_...` key, or a legacy JWT carrying `role: "service_role"` (or
 * anything else) — doesn't just break auth, it ships full-privilege,
 * RLS-bypassing database access to every visitor.
 *
 * This is an allowlist, not a denylist: only a recognized publishable/anon
 * shape passes, so unrecognized, truncated, or malformed values fail closed
 * instead of slipping through unchecked.
 */
export function getPublicSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!key) return key;

  if (key.startsWith(NEW_FORMAT_PUBLISHABLE_PREFIX)) return key;

  if (key.startsWith(NEW_FORMAT_SECRET_PREFIX)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is set to a secret/service_role key (sb_secret_...), which " +
        "gets shipped to every visitor's browser. Set it to the publishable key (sb_publishable_...) " +
        "from Supabase Project Settings > API instead, and rotate the leaked secret key immediately."
    );
  }

  const role = legacyKeyRole(key);
  if (role === "anon") return key;

  throw new Error(
    role
      ? `NEXT_PUBLIC_SUPABASE_ANON_KEY is set to a legacy key with role "${role}", not "anon". Every ` +
        "NEXT_PUBLIC_* value is shipped to every visitor's browser, so only the anon/publishable key " +
        "from Supabase Project Settings > API belongs here. Rotate the leaked key immediately."
      : "NEXT_PUBLIC_SUPABASE_ANON_KEY is not a recognizable publishable/anon key (expected an " +
        "sb_publishable_... key or a legacy anon JWT). Every NEXT_PUBLIC_* value is shipped to every " +
        "visitor's browser, so double-check this is the publishable/anon key from Supabase Project " +
        "Settings > API, not a secret key or a corrupted value."
  );
}
