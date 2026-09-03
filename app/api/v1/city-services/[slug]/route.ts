import type { CityServiceDetail } from "@gohargeisa/api";
import { getCityServiceBySlug } from "@/lib/data/city-services";
import { getCategories } from "@/lib/data/categories";
import { corsPreflight, handle, jsonError, jsonOk } from "../../_lib/http";
import { categoryRef, toCityServiceDetail } from "../../_lib/dto";


export function OPTIONS() {
  return corsPreflight();
}

type RouteCtx = { params: { slug: string } };

/**
 * GET /api/v1/city-services/<slug>
 *
 * One partner's full detail payload (locale-resolved name/description +
 * reviews + hours + gallery + socials). Only published rows are visible —
 * the public Supabase client is RLS-scoped to `status = 'published'`.
 */
export const GET = handle<RouteCtx>(async (_req, { locale, route }) => {
  const { slug } = route.params;
  if (!slug) return jsonError(400, "Missing slug", "bad_request");

  const service = await getCityServiceBySlug(slug, locale);
  if (!service) return jsonError(404, "Not found", "not_found");

  const category = (await getCategories()).find((c) => c.id === service.categoryId);
  const ref = category ? categoryRef(category, locale) : undefined;

  const body: CityServiceDetail = toCityServiceDetail(service, ref);
  return jsonOk(body);
});
