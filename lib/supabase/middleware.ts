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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabase };
}
