import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale, isLocale } from "./lib/i18n/config";
import { refreshSupabaseSession } from "./lib/supabase/middleware";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

// Admin sub-sections business owners may also manage (their own listings
// only — see the "Owners manage their {hotels,restaurants,cafes,city
// services}" RLS policies in supabase/schema.sql and
// supabase/migrations/20260809000001_city_services_owner_id.sql). Every
// other /admin section (users, articles, attractions, events, the dashboard
// index) is owner-only.
const BUSINESS_OWNER_ADMIN_SECTIONS = new Set(["hotels", "restaurants", "cafes", "city-services"]);

export default async function middleware(request: NextRequest) {
  // Locale routing runs first and produces the response we'll actually
  // return — including the correct /en, /ar, /so rewrite/redirect.
  const response = intlMiddleware(request);

  // Supabase session refresh writes its cookies onto that SAME response
  // object (see lib/supabase/middleware.ts) so nothing gets dropped. It's
  // skipped until env vars are configured, so the app still runs before a
  // Supabase project is connected (see README).
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { user, supabase } = await refreshSupabaseSession(request, response);

    // /dashboard and /admin are also gated by lib/supabase/guards.ts on the
    // page itself (defense-in-depth). But every route under app/[locale]
    // streams behind app/[locale]/loading.tsx's Suspense boundary, so by the
    // time a page-level `redirect()` runs, the 200 response has often
    // already started — Next falls back to a client-side <meta refresh>
    // instead of a real HTTP redirect, which a bot, crawler, or anything
    // without JS will simply never follow. Gating here, before any
    // rendering starts, guarantees a genuine HTTP 307 every time.
    const segments = request.nextUrl.pathname.split("/").filter(Boolean);
    if (isLocale(segments[0])) {
      const locale = segments[0];
      const section = segments[1];

      if (section === "dashboard" || section === "admin" || section === "business") {
        if (!user) {
          const loginUrl = new URL(`/${locale}/auth/login`, request.url);
          loginUrl.searchParams.set("next", request.nextUrl.pathname);
          return NextResponse.redirect(loginUrl);
        }

        if (section === "admin") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          const role = profile?.role;
          // Business owners may only edit/list their own listings, never
          // create new ones (see requireAdmin vs requireListingsAccess on
          // the .../new pages — RLS grants them UPDATE only, no INSERT).
          const isBusinessSection =
            BUSINESS_OWNER_ADMIN_SECTIONS.has(segments[2] ?? "") && segments[3] !== "new";
          const allowed = role === "owner" || (isBusinessSection && role === "business_owner");

          if (!allowed) {
            return NextResponse.redirect(new URL(`/${locale}`, request.url));
          }
        }

        // /business is the dedicated business-owner dashboard — same
        // owner-or-business_owner door as the admin listings sections,
        // just without the per-section allowlist (every /business/* page
        // is available to both roles; ownership of individual data is
        // still scoped by RLS + lib/data/business.ts's owner_id filters).
        if (section === "business") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          const role = profile?.role;
          if (role !== "owner" && role !== "business_owner") {
            return NextResponse.redirect(new URL(`/${locale}`, request.url));
          }
        }
      }
    }
  }

  return response;
}

export const config = {
  // Skip api, static files, images, and _next internals
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
