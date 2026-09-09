import type { CafeListItem, Paginated } from "@gohargeisa/api";
import { getCafes } from "@/lib/data/cafes";
import { corsPreflight, handle, jsonOk, parsePageParams } from "../_lib/http";
import { toCafeListItem } from "../_lib/dto";

export function OPTIONS() {
  return corsPreflight();
}

/**
 * GET /api/v1/cafes?q=<text>&page=&pageSize=
 *
 * Mirrors restaurants/route.ts; unlike restaurants, cafes DO have a
 * localized `description` column, so `locale` is threaded through to
 * `getCafes` exactly as the website's own cafe pages already do.
 */
export const GET = handle(async (req, { locale }) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() || undefined;
  const { page, pageSize } = parsePageParams(req);

  const all = await getCafes({ q, locale });
  const total = all.length;
  const start = (page - 1) * pageSize;
  const pageRows = all.slice(start, start + pageSize);

  const body: Paginated<CafeListItem> = {
    items: pageRows.map(toCafeListItem),
    page,
    pageSize,
    total,
    hasMore: start + pageSize < total,
  };
  return jsonOk(body);
});
