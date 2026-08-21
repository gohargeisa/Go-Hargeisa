/**
 * Where an account lands after sign-in when no explicit `next` redirect was
 * requested — role='owner' reaches the existing Owner Control Center
 * (/admin), role='business_owner' reaches their existing Business Dashboard
 * (/business), everyone else keeps the existing consumer /dashboard. Reuses
 * the same `profiles.role` value lib/supabase/guards.ts already gates
 * routes on — not a new authorization system, just where a login that
 * started at /auth/login directly (rather than a bounce from a specific
 * protected page, which already sets its own `next`) lands by default.
 *
 * No framework imports on purpose — auth-form.tsx (client component) and
 * auth/callback/route.ts (server route handler) both need this, and a
 * server-only import (e.g. lib/supabase/server's createClient) would break
 * the client bundle.
 */
export function defaultPostLoginPath(locale: string, role: string | null | undefined): string {
  if (role === "owner") return `/${locale}/admin`;
  if (role === "business_owner") return `/${locale}/business`;
  return `/${locale}/dashboard`;
}
