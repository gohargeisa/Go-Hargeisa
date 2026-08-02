import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { CityService, EssentialServiceCategory, GalleryImage } from "@/types";

function toGallery(json: unknown): GalleryImage[] {
  return Array.isArray(json) ? (json as unknown as { url: string; alt?: string; category?: string }[]) : [];
}

function mapCityService(
  row: {
    id: string;
    category: EssentialServiceCategory;
    name: string;
    name_ar: string | null;
    name_so: string | null;
    description: string | null;
    description_ar: string | null;
    description_so: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    opening_hours: string | null;
    maps_url: string | null;
    website: string | null;
    image: string | null;
    gallery: unknown;
    status: "draft" | "published" | "archived";
    featured: boolean;
    sort_order: number;
  },
  locale?: string
): CityService {
  return {
    id: row.id,
    category: row.category,
    name: (locale === "ar" && row.name_ar) || (locale === "so" && row.name_so) || row.name,
    description: (locale === "ar" && row.description_ar) || (locale === "so" && row.description_so) || row.description,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    openingHours: row.opening_hours,
    mapsUrl: row.maps_url,
    website: row.website,
    image: row.image,
    gallery: toGallery(row.gallery),
    status: row.status,
    featured: row.featured,
    sortOrder: row.sort_order,
  };
}

export interface CityServiceCategoryGroup {
  category: EssentialServiceCategory;
  items: CityService[];
}

/**
 * Fully dynamic — this is the ONLY query City Services' public surfaces run:
 * one fetch of every published row (regardless of category), grouped in JS
 * and sorted by real listing count, descending. A category with zero
 * published rows simply never appears in the result — no hardcoded category
 * list gates this, and no code change is ever needed when the first listing
 * in a new category goes live or the last one is removed. Within a category,
 * featured listings sort first, then by sort_order/created_at.
 *
 * No mock-data fallback: unlike every other content type, this directory is
 * meant to ship empty until the owner adds real entries, so "not
 * configured" and "configured but empty" both correctly render as no
 * categories at all.
 */
export async function getCityServicesGroupedByCategory(locale?: string): Promise<CityServiceCategoryGroup[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("city_services")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getCityServicesGroupedByCategory:", error.message);
    return [];
  }

  const byCategory = new Map<EssentialServiceCategory, CityService[]>();
  for (const row of data ?? []) {
    const service = mapCityService(row, locale);
    const list = byCategory.get(service.category);
    if (list) list.push(service);
    else byCategory.set(service.category, [service]);
  }

  return Array.from(byCategory.entries())
    .map(([category, items]) => ({ category, items }))
    .sort((a, b) => b.items.length - a.items.length);
}

/** Category + count only (no item details) — used wherever only the
 * "which categories are non-empty, and how many places in each" summary is
 * needed (homepage tiles), so callers that don't need full listing details
 * aren't forced to also fetch/pass them around. */
export async function getCityServiceCategoryCounts(): Promise<{ category: EssentialServiceCategory; count: number }[]> {
  const groups = await getCityServicesGroupedByCategory();
  return groups.map((g) => ({ category: g.category, count: g.items.length }));
}
