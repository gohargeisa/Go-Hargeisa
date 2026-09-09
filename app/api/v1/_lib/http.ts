import { NextResponse, type NextRequest } from "next/server";
import type { ApiErrorBody, ApiLocale } from "@gohargeisa/api";
import { locales, defaultLocale, isLocale } from "@/lib/i18n/config";

/**
 * Shared plumbing for the additive `/api/v1/*` read layer consumed by the
 * native app. These handlers:
 *   - are public reads (RLS `status = 'published'`) — no cookies, no
 *     service-role, same data anyone can already fetch from the website;
 *   - resolve the response locale from `Accept-Language` (en | ar | so);
 *   - return permissive CORS + a short public cache, since the payloads are
 *     the same for every anonymous caller.
 */

const CACHE_SECONDS = 60;

export function resolveLocale(req: NextRequest): ApiLocale {
  const raw = (req.headers.get("accept-language") ?? "").toLowerCase();
  // Accept-Language can be "ar-SA,ar;q=0.9,en;q=0.8" — take the first tag's
  // primary subtag and match it against our supported set.
  const first = raw.split(",")[0]?.trim().split("-")[0] ?? "";
  return isLocale(first) ? (first as ApiLocale) : (defaultLocale as ApiLocale);
}

export function jsonOk<T>(
  data: T,
  init?: { cache?: boolean; methods?: string },
): NextResponse {
  const res = NextResponse.json(data);
  res.headers.set(
    "Cache-Control",
    init?.cache === false
      ? "no-store"
      : `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=300`,
  );
  applyCors(res, init?.methods);
  return res;
}

export function jsonError(
  status: number,
  message: string,
  code?: string,
  methods?: string,
): NextResponse {
  const body: ApiErrorBody = code ? { error: message, code } : { error: message };
  const res = NextResponse.json(body, { status });
  applyCors(res, methods);
  return res;
}

function applyCors(res: NextResponse, methods = "GET, OPTIONS"): void {
  // The native app has no Origin (it's not a browser context), but Expo web
  // / a local debug tool might — and these are public reads (or, for a
  // write route, an anonymous-writable/bearer-scoped RPC) either way.
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", methods);
  res.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept-Language");
  res.headers.set("Vary", "Accept-Language");
}

export function corsPreflight(methods = "GET, OPTIONS"): NextResponse {
  const res = new NextResponse(null, { status: 204 });
  applyCors(res, methods);
  return res;
}

/** Extract the bearer token from `Authorization: Bearer <token>`, or `null`
 *  when absent (an anonymous caller) — see lib/supabase/bearer.ts. */
export function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

/** Wrap a handler so an unexpected throw becomes a clean 500 instead of an
 *  HTML error page (the app expects JSON). `route` is Next's route context
 *  ({ params }) for dynamic segments — untyped here, narrowed per route. */
export function handle<C = unknown>(
  fn: (
    req: NextRequest,
    ctx: { locale: ApiLocale; route: C },
  ) => Promise<NextResponse>,
) {
  return async (req: NextRequest, route: C): Promise<NextResponse> => {
    try {
      return await fn(req, { locale: resolveLocale(req), route });
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[/api/v1]", err);
      }
      return jsonError(500, "Internal error", "internal");
    }
  };
}

export function parsePageParams(req: NextRequest): { page: number; pageSize: number } {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSizeRaw = Number(url.searchParams.get("pageSize")) || 20;
  const pageSize = Math.min(50, Math.max(1, pageSizeRaw));
  return { page, pageSize };
}

export { locales };
