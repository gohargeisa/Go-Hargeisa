import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { Locale } from "@/lib/i18n/config";

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
 * Requires a signed-in user with role = 'admin' in `profiles`. Redirects
 * non-admins to the homepage and signed-out visitors to /auth/login.
 */
export async function requireAdmin(locale: Locale, redirectTo: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login?next=${encodeURIComponent(redirectTo)}`);
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin") {
    redirect(`/${locale}`);
  }

  return user;
}
