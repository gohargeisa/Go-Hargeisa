import type { Paginated, RestaurantListItem } from "@gohargeisa/api";
import { getRestaurants } from "@/lib/data/restaurants";
import { corsPreflight, handle, jsonOk, parsePageParams } from "../_lib/http";
import { toRestaurantListItem } from "../_lib/dto";

export function OPTIONS() {
  return corsPreflight();
}

/**
 * GET /api/v1/restaurants?q=<text>&page=&pageSize=
 *
 * Mirrors city-services/route.ts's shape exactly, backed by the website's
 * own `getRestaurants` (public, `status = 'published'`). Restaurants have no
 * localized name/description columns, so no locale param is threaded
 * through — see toRestaurantListItem's own comment.
 */
export const GET = handle(async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() || undefined;
  const { page, pageSize } = parsePageParams(req);

  const all = await getRestaurants({ q });
  const total = all.length;
  const start = (page - 1) * pageSize;
  const pageRows = all.slice(start, start + pageSize);

  const body: Paginated<RestaurantListItem> = {
    items: pageRows.map(toRestaurantListItem),
    page,
    pageSize,
    total,
    hasMore: start + pageSize < total,
  };
  return jsonOk(body);
});
