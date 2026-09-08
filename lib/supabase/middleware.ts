import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getPublicSupabaseAnonKey } from "@/lib/supabase/is-configured";

/**
 * Refreshes the Supabase auth session and writes any updated cookies onto
 * the SAME response object that's ultimately returned by middleware.ts.
 *
 * Previous version built its own NextResponse and returned it, while
 * middleware.ts kept returning the next-intl response instead — meaning the
 * refreshed session cookies were silently discarded. This version mutates a
 * response passed in by the caller so both concerns share one response.
 *
 * Also returns the resolved user (and the client used to fetch it) so
 * middleware.ts can gate /dashboard and /admin here — see the comment above
 * that route-protection block for why it can't be left to page-level
 * `redirect()` calls alone.
 */
// getUser() is a network call to Supabase's Auth API on every single page
// load (this runs in middleware for effectively every route) — with no
// timeout of its own. A hang there (Supabase-side slowness, a bad network
// path, an oversized/malformed cookie on one particular request) previously
// meant the whole middleware invocation hung with it, all the way to
// Vercel's hard 300s edge-function ceiling — a site-wide 504
// (MIDDLEWARE_INVOCATION_TIMEOUT) instead of a graceful "treat as logged
// out" fallback. Live evidence: repeated `Task timed out after 300 seconds`
// errors on this exact call.
const AUTH_TIMEOUT_MS = 5000;

async function getUserWithTimeout(
  supabase: ReturnType<typeof createServerClient>
): Promise<User | null> {
  const timeout = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), AUTH_TIMEOUT_MS);
  });
  try {
    return await Promise.race([supabase.auth.getUser().then((r) => r.data.user), timeout]);
  } catch {
    return null;
  }
}

export async function refreshSupabaseSession(
  request: NextRequest,
  response: NextResponse
): Promise<{ user: User | null; supabase: ReturnType<typeof createServerClient> }> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getPublicSupabaseAnonKey(),
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Touching getUser() refreshes the token if it's expired and triggers the
  // `set`/`remove` callbacks above, which now write onto `response` directly.
  // A timeout here still skips the refresh for this one request (safe — it
  // just retries next request) instead of hanging the whole site.
  const user = await getUserWithTimeout(supabase);

  return { user, supabase };
}
