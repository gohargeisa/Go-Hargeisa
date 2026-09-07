import type { RestaurantDetail } from "@gohargeisa/api";
import { getRestaurantBySlug } from "@/lib/data/restaurants";
import { getProductsForListing } from "@/lib/data/products";
import { corsPreflight, handle, jsonError, jsonOk } from "../../_lib/http";
import { toRestaurantDetail } from "../../_lib/dto";

export function OPTIONS() {
  return corsPreflight();
}

type RouteCtx = { params: { slug: string } };

/** GET /api/v1/restaurants/<slug> — one restaurant's full detail payload,
 *  including its product catalog when catalogOrderingEnabled is true (maps
 *  to the `restaurants.ordering_enabled` column — same column cafes use,
 *  different field name on the Restaurant type; see mapRestaurant). */
export const GET = handle<RouteCtx>(async (_req, { locale, route }) => {
  const { slug } = route.params;
  if (!slug) return jsonError(400, "Missing slug", "bad_request");

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return jsonError(404, "Not found", "not_found");

  const products = restaurant.catalogOrderingEnabled
    ? await getProductsForListing(restaurant.id, "restaurant")
    : [];

  const body: RestaurantDetail = toRestaurantDetail(restaurant, locale, products);
  return jsonOk(body);
});
