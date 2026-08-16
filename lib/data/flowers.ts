import { getCafes, getCafeBySlug } from "./cafes";
import { getCityServicesGroupedByCategory, getCityServiceBySlug } from "./city-services";
import { getCategoryById } from "./categories";
import type { Cafe, CityService } from "@/types";

/**
 * "Flowers" is a cross-cutting experience, not a single listing table — a
 * flower business today is either:
 *  - a real Flower Shop city_service (categories.slug = 'flower-shops',
 *    already a real category with supports_products=true — just never
 *    promoted to its own nav entry, since Flowers needs to also aggregate
 *    cafes and a plain is_pinned nav link only ever points at one table), or
 *  - a cafe with a flower product line alongside its café menu
 *    (cafes.sells_flowers = true — Lavender is the only one today).
 * No new table, no new column: both flags already existed for exactly this
 * purpose before this file did. Reuses getCafes()/getCityServicesGroupedByCategory()
 * as-is (same queries every other page already runs) and filters in memory.
 */
const FLOWER_SHOPS_CATEGORY_SLUG = "flower-shops";

export interface FlowerBusinessSummary {
  listingType: "cafe" | "city_service";
  id: string;
  slug: string;
  name: string;
  coverImage: string;
  address: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
}

export async function getFlowerBusinesses(locale?: string): Promise<FlowerBusinessSummary[]> {
  const [cafesList, cityServiceGroups] = await Promise.all([
    getCafes({ locale }),
    getCityServicesGroupedByCategory(locale),
  ]);

  const flowerCafes = cafesList.filter((c) => c.sellsFlowers);
  const flowerCityServices = cityServiceGroups.find((g) => g.category.slug === FLOWER_SHOPS_CATEGORY_SLUG)?.items ?? [];

  const fromCafes: FlowerBusinessSummary[] = flowerCafes.map((c) => ({
    listingType: "cafe",
    id: c.id,
    slug: c.slug,
    name: c.name,
    coverImage: c.coverImage,
    address: c.address,
    rating: c.rating,
    reviewCount: c.reviewCount,
    featured: c.featured ?? false,
  }));

  const fromCityServices: FlowerBusinessSummary[] = flowerCityServices.map((s) => ({
    listingType: "city_service",
    id: s.id,
    slug: s.slug,
    name: s.name,
    coverImage: s.image ?? "",
    address: "",
    rating: s.rating,
    reviewCount: s.reviewCount,
    featured: s.featured,
  }));

  return [...fromCafes, ...fromCityServices].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating
  );
}

export type FlowerBusinessDetail =
  | { listingType: "cafe"; cafe: Cafe }
  | { listingType: "city_service"; cityService: CityService };

/** Tries a cafe with sells_flowers=true first, then a city_service actually
 * filed under the Flower Shops category — a slug is only ever meaningful in
 * one of the two tables in practice, so the first real match wins. */
export async function getFlowerBusinessBySlug(slug: string, locale?: string): Promise<FlowerBusinessDetail | null> {
  const cafe = await getCafeBySlug(slug, locale);
  if (cafe?.sellsFlowers) return { listingType: "cafe", cafe };

  const cityService = await getCityServiceBySlug(slug, locale);
  if (cityService) {
    const category = await getCategoryById(cityService.categoryId);
    if (category?.slug === FLOWER_SHOPS_CATEGORY_SLUG) return { listingType: "city_service", cityService };
  }

  return null;
}
