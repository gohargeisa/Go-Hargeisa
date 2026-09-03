import type { CityServiceListItem, Paginated } from "@gohargeisa/api";
import { getCityServicesGroupedByCategory } from "@/lib/data/city-services";
import {
  corsPreflight,
  handle,
  jsonOk,
  parsePageParams,
} from "../_lib/http";
import { categoryRef, toCityServiceListItem } from "../_lib/dto";


export function OPTIONS() {
  return corsPreflight();
}

/**
 * GET /api/v1/city-services?category=<slug>&q=<text>&page=&pageSize=
 *
 * Flattens the website's category-grouped city-services view (already
 * locale-resolved, published-only, feature-flag filtered, cached) into a
 * paginated list. Featured listings sort first (the grouping helper already
 * orders each group that way); groups themselves are ordered by size.
 */
export const GET = handle(async (req, { locale }) => {
  const url = new URL(req.url);
  const categorySlug = url.searchParams.get("category")?.trim().toLowerCase() || null;
  const q = url.searchParams.get("q")?.trim().toLowerCase() || null;
  const { page, pageSize } = parsePageParams(req);

  const groups = await getCityServicesGroupedByCategory(locale);

  let rows = groups.flatMap((g) => {
    const ref = categoryRef(g.category, locale);
    return g.items.map((item) => ({ item, category: ref }));
  });

  if (categorySlug) {
    rows = rows.filter((r) => r.category.slug.toLowerCase() === categorySlug);
  }

  if (q) {
    rows = rows.filter(
      (r) =>
        r.item.name.toLowerCase().includes(q) ||
        (r.item.description ?? "").toLowerCase().includes(q) ||
        r.category.name.toLowerCase().includes(q),
    );
  }

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  const body: Paginated<CityServiceListItem> = {
    items: pageRows.map((r) => toCityServiceListItem(r.item, r.category)),
    page,
    pageSize,
    total,
    hasMore: start + pageSize < total,
  };
  return jsonOk(body);
});
