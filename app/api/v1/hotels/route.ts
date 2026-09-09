import type { HotelListItem, Paginated } from "@gohargeisa/api";
import { getHotels } from "@/lib/data/hotels";
import { corsPreflight, handle, jsonOk, parsePageParams } from "../_lib/http";
import { toHotelListItem } from "../_lib/dto";

export function OPTIONS() {
  return corsPreflight();
}

/**
 * GET /api/v1/hotels?q=<text>&page=&pageSize=
 *
 * Mirrors restaurants/route.ts. `getHotels()` doesn't accept a locale param
 * (only `getHotelBySlug` does) — see toHotelListItem's own comment — so list
 * results are always English, matching the website's real behavior.
 */
export const GET = handle(async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() || undefined;
  const { page, pageSize } = parsePageParams(req);

  const all = await getHotels({ q });
  const total = all.length;
  const start = (page - 1) * pageSize;
  const pageRows = all.slice(start, start + pageSize);

  const body: Paginated<HotelListItem> = {
    items: pageRows.map(toHotelListItem),
    page,
    pageSize,
    total,
    hasMore: start + pageSize < total,
  };
  return jsonOk(body);
});
