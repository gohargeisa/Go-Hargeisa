import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { toHeaderUser, type HeaderUser } from "@/lib/supabase/header-user";
import type { Locale } from "@/lib/i18n/config";

/**
 * Resolves the signed-in user's header info (name, role, avatar) server-side
 * for app/[locale]/layout.tsx to pass into <SiteHeader> as its initial
 * state. Never redirects — every page, signed in or not, renders this
 * layout, so it just returns null for a signed-out visitor.
 *
 * app/[locale]/layout.tsx already sets `export const dynamic =
 * "force-dynamic"` (next-intl's request-based APIs require it), so the
 * whole route tree is dynamically rendered on every request regardless —
 * resolving auth here costs nothing extra and removes the client-only
 * "signed out" flash on first paint that a purely client-side check has.
 * A client-side subscription (components/layout/use-header-user.ts) still
 * keeps the header live after sign-in/sign-out without a full reload.
 */
export async function getHeaderUser(): Promise<HeaderUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", authUser.id)
    .single();

  return toHeaderUser(authUser, profile);
}

/**
 * Requires a signed-in user. Redirects to /auth/login (preserving a
 * `next` redirect target) if there's no session.
 *
 * When Supabase isn't configured yet, this intentionally does NOT block
 * access — it lets you preview /dashboard and /admin with mock data while
 * building, but every real deployment must have Supabase connected before
 * going live, at which point this guard becomes authoritative.
 */
export async function requireUser(locale: Locale, redirectTo: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login?next=${encodeURIComponent(redirectTo)}`);
  }

  return user;
}

/**
 * Requires a signed-in user with role = 'owner' in `profiles`. Redirects
 * non-owners to the homepage and signed-out visitors to /auth/login.
 */
export async function requireOwner(locale: Locale, redirectTo: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login?next=${encodeURIComponent(redirectTo)}`);
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "owner") {
    redirect(`/${locale}`);
  }

  return user;
}

/**
 * @deprecated Use requireOwner instead. Admin role has been renamed to owner.
 */
export async function requireAdmin(locale: Locale, redirectTo: string) {
  return requireOwner(locale, redirectTo);
}

/**
 * Requires a signed-in user with role = 'owner' OR 'business_owner'.
 * Used only by the hotels/restaurants/cafes admin sections, where
 * business owners may manage their own listings (see the "Owners manage
 * their {hotels,restaurants,cafes}" RLS policies in supabase/schema.sql,
 * which only grant business owners UPDATE on rows where owner_id matches
 * their own id — no insert/delete). Callers must still scope any list
 * query and hide create/delete UI for business_owner themselves; this
 * guard only decides who gets past the door.
 *
 * Redirects non-owners/non-business-owners to the homepage and
 * signed-out visitors to /auth/login.
 */
export async function requireListingsAccess(
  locale: Locale,
  redirectTo: string
): Promise<{ userId: string; role: "owner" | "business_owner" } | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login?next=${encodeURIComponent(redirectTo)}`);
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "owner" && profile?.role !== "business_owner") {
    redirect(`/${locale}`);
  }

  return { userId: user.id, role: profile.role };
}
