import type { HotelDetail } from "@gohargeisa/api";
import { getHotelBySlug } from "@/lib/data/hotels";
import { corsPreflight, handle, jsonError, jsonOk } from "../../_lib/http";
import { toHotelDetail } from "../../_lib/dto";

export function OPTIONS() {
  return corsPreflight();
}

type RouteCtx = { params: { slug: string } };

/** GET /api/v1/hotels/<slug> — one hotel's full detail payload, including
 *  its rooms. Locale-resolved (unlike the list endpoint). */
export const GET = handle<RouteCtx>(async (_req, { locale, route }) => {
  const { slug } = route.params;
  if (!slug) return jsonError(400, "Missing slug", "bad_request");

  const hotel = await getHotelBySlug(slug, locale);
  if (!hotel) return jsonError(404, "Not found", "not_found");

  const body: HotelDetail = toHotelDetail(hotel);
  return jsonOk(body);
});
