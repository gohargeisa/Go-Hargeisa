import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseAnonKey } from "@/lib/supabase/is-configured";

/**
 * A Supabase client scoped to a caller-supplied access token (the native
 * app's `Authorization: Bearer <token>` header), so `auth.uid()` resolves
 * inside RLS/RPCs exactly as it would for that user's own session — the
 * token-based equivalent of lib/supabase/server.ts's cookie-based client,
 * for a context (a Route Handler called by the mobile app) that has no
 * cookies to read. Pass `token` as `null`/`undefined` for an anonymous
 * caller — several RPCs (e.g. submit_appointment_request) are explicitly
 * anonymous-writable and only attach `user_id` when a session is present.
 *
 * Never use this for admin/service-role work — same anon key + RLS as every
 * other client in this codebase, just with a caller identity attached.
 */
export function createBearerClient(token?: string | null) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getPublicSupabaseAnonKey(),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
    }
  );
}
