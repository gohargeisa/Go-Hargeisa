import type { CafeDetail } from "@gohargeisa/api";
import { getCafeBySlug } from "@/lib/data/cafes";
import { getProductsForListing } from "@/lib/data/products";
import { corsPreflight, handle, jsonError, jsonOk } from "../../_lib/http";
import { toCafeDetail } from "../../_lib/dto";

export function OPTIONS() {
  return corsPreflight();
}

type RouteCtx = { params: { slug: string } };

/** GET /api/v1/cafes/<slug> — one cafe's full detail payload, including its
 *  product catalog when ordering_enabled is true. */
export const GET = handle<RouteCtx>(async (_req, { locale, route }) => {
  const { slug } = route.params;
  if (!slug) return jsonError(400, "Missing slug", "bad_request");

  const cafe = await getCafeBySlug(slug, locale);
  if (!cafe) return jsonError(404, "Not found", "not_found");

  const products = cafe.orderingEnabled ? await getProductsForListing(cafe.id, "cafe") : [];

  const body: CafeDetail = toCafeDetail(cafe, locale, products);
  return jsonOk(body);
});
