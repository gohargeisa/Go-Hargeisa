import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SERVICES_PUBLIC_ENABLED } from "@/lib/config/features";
import type { CityService, EssentialServiceCategory } from "@/types";

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
    opening_hours: string | null;
    maps_url: string | null;
    website: string | null;
    image: string | null;
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
    openingHours: row.opening_hours,
    mapsUrl: row.maps_url,
    website: row.website,
    image: row.image,
    status: row.status,
    featured: row.featured,
    sortOrder: row.sort_order,
  };
}

/** Public, published+featured only, no cookies — safe for ISR. The owner can
 * keep more than 4 rows per category (e.g. rotating which are live) without
 * deleting anything; only the up-to-4 featured ones ever show here — see
 * the featured-cap check in lib/actions/city-services.ts. No mock-data
 * fallback: unlike every other content type, this directory is meant to
 * ship empty (see Phase 2 product decision — no fabricated city services)
 * until the owner adds real entries, so "not configured" and "configured
 * but empty" both correctly render as empty categories. */
export async function getCityServicesByCategory(category: EssentialServiceCategory, locale?: string): Promise<CityService[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("city_services")
    .select("*")
    .eq("category", category)
    .eq("status", "published")
    .eq("featured", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getCityServicesByCategory:", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapCityService(row, locale));
}

export async function getAllCityServices(locale?: string): Promise<Record<EssentialServiceCategory, CityService[]>> {
  const categories: EssentialServiceCategory[] = ["hospital", "bank", "supermarket", "pharmacy"];
  const results = await Promise.all(categories.map((c) => getCityServicesByCategory(c, locale)));
  return {
    hospital: results[0],
    bank: results[1],
    supermarket: results[2],
    pharmacy: results[3],
  };
}

export interface ExploreHargeisaCounts {
  hospital: number;
  pharmacy: number;
  gasStation: number;
  supermarket: number;
  mosque: number;
}

/** Real published-item counts per category shown on the homepage's
 * "Explore Hargeisa" tile grid — used so that section only ever shows a
 * tile backed by real data (never a "coming soon" placeholder). hospital/
 * pharmacy/supermarket read from city_services (the live City Services
 * directory); gas_station reads from the separate `services` table, gated
 * by the same SERVICES_PUBLIC_ENABLED flag every other public Services
 * surface respects; mosque reads from `map_points` (Smart City Map), the
 * only table that carries that category at all. */
export async function getExploreHargeisaCounts(): Promise<ExploreHargeisaCounts> {
  if (!isSupabaseConfigured()) {
    return { hospital: 0, pharmacy: 0, gasStation: 0, supermarket: 0, mosque: 0 };
  }

  const supabase = createPublicClient();
  const countCityService = (category: EssentialServiceCategory) =>
    supabase.from("city_services").select("id", { count: "exact", head: true }).eq("category", category).eq("status", "published").eq("featured", true);

  const [hospital, pharmacy, supermarket, gasStation, mosque] = await Promise.all([
    countCityService("hospital"),
    countCityService("pharmacy"),
    countCityService("supermarket"),
    SERVICES_PUBLIC_ENABLED
      ? supabase.from("services").select("id", { count: "exact", head: true }).eq("category", "gas_station").eq("status", "published")
      : Promise.resolve({ count: 0 }),
    supabase.from("map_points").select("id", { count: "exact", head: true }).eq("category", "mosque"),
  ]);

  return {
    hospital: hospital.count ?? 0,
    pharmacy: pharmacy.count ?? 0,
    supermarket: supermarket.count ?? 0,
    gasStation: gasStation.count ?? 0,
    mosque: mosque.count ?? 0,
  };
}
