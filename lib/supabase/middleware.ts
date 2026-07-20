import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session and writes any updated cookies onto
 * the SAME response object that's ultimately returned by middleware.ts.
 *
 * Previous version built its own NextResponse and returned it, while
 * middleware.ts kept returning the next-intl response instead — meaning the
 * refreshed session cookies were silently discarded. This version mutates a
 * response passed in by the caller so both concerns share one response.
 */
export async function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  await supabase.auth.getUser();

  return response;
}
