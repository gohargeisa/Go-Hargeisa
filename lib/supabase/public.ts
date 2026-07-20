import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * A Supabase client that does NOT read cookies (unlike lib/supabase/server.ts).
 *
 * Public content — hotels, restaurants, cafes, attractions, events, articles,
 * destinations, map points — is readable by anyone per our RLS policies
 * (`for select using (status = 'published')` / `using (true)`), so fetching
 * it doesn't require knowing who's signed in.
 *
 * Next.js treats any call to `cookies()` (which the cookie-aware server
 * client uses internally) as a signal that a route must be rendered
 * dynamically on every request. Using this client instead for public reads
 * lets those pages be statically generated and revalidated on a schedule
 * (see each page's `export const revalidate`), which is significantly
 * faster and cheaper than full SSR on every visit.
 *
 * Never use this client for anything user-specific (favorites, saved trips,
 * reviews submission, admin writes, auth) — use lib/supabase/server.ts for
 * those, since RLS depends on `auth.uid()` being set from the session.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
