import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "./lib/i18n/config";
import { refreshSupabaseSession } from "./lib/supabase/middleware";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export default async function middleware(request: NextRequest) {
  // Locale routing runs first and produces the response we'll actually
  // return — including the correct /en, /ar, /so rewrite/redirect.
  const response = intlMiddleware(request);

  // Supabase session refresh writes its cookies onto that SAME response
  // object (see lib/supabase/middleware.ts) so nothing gets dropped. It's
  // skipped until env vars are configured, so the app still runs before a
  // Supabase project is connected (see README).
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    await refreshSupabaseSession(request, response);
  }

  return response;
}

export const config = {
  // Skip api, static files, images, and _next internals
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
