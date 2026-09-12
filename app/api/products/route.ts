import { NextResponse, type NextRequest } from "next/server";
import { getProductsPageForListing, type ProductSortKey } from "@/lib/data/products";
import type { OrderableListingType, ProductGender } from "@/types";

const LISTING_TYPES: OrderableListingType[] = ["city_service", "service", "cafe", "restaurant"];
const GENDERS: ProductGender[] = ["men", "women", "unisex", "kids"];
const SORT_KEYS: ProductSortKey[] = ["featured", "newest", "priceLow", "priceHigh", "name"];

const DEFAULT_LIMIT = 48;
const MAX_LIMIT = 96;

/**
 * GET /api/products — one page of a listing's product catalog, filtered and
 * sorted server-side (see lib/data/products.ts's getProductsPageForListing).
 * Backs every storefront's "Load More" and category/gender/brand filter
 * changes — a public, RLS-respecting read, same trust level as any other
 * public listing page. Not part of the versioned /api/v1/* mobile API
 * (see app/api/v1/_lib) — this is an internal implementation detail of the
 * website's own client components, not a stable external contract.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const listingId = params.get("listingId");
  const listingTypeParam = params.get("listingType");
  if (!listingId || !listingTypeParam || !LISTING_TYPES.includes(listingTypeParam as OrderableListingType)) {
    return NextResponse.json({ error: "Missing or invalid listingId/listingType" }, { status: 400 });
  }
  const listingType = listingTypeParam as OrderableListingType;

  const limitParam = Number(params.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), MAX_LIMIT) : DEFAULT_LIMIT;

  const offsetParam = Number(params.get("offset"));
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? Math.floor(offsetParam) : 0;

  const categoryParam = params.get("category") || undefined;
  const category = categoryParam ? categoryParam.split(",").filter(Boolean) : undefined;

  const genderParam = params.get("gender");
  const gender = genderParam && GENDERS.includes(genderParam as ProductGender) ? (genderParam as ProductGender) : undefined;

  const brandQuery = params.get("brand") || undefined;
  const brand = params.get("brandExact") || undefined;
  const nameQuery = params.get("q") || undefined;

  const sortParam = params.get("sort");
  const sort = sortParam && SORT_KEYS.includes(sortParam as ProductSortKey) ? (sortParam as ProductSortKey) : "featured";

  const page = await getProductsPageForListing(listingId, listingType, {
    limit,
    offset,
    category,
    gender,
    brandQuery,
    brand,
    nameQuery,
    sort,
  });
  return NextResponse.json(page);
}
