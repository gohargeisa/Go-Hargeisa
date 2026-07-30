import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { CityService, EssentialServiceCategory } from "@/types";

function mapCityService(row: {
  id: string;
  category: EssentialServiceCategory;
  name: string;
  description: string | null;
  phone: string | null;
  opening_hours: string | null;
  maps_url: string | null;
  image: string | null;
  status: "draft" | "published" | "archived";
  featured: boolean;
  sort_order: number;
}): CityService {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description,
    phone: row.phone,
    openingHours: row.opening_hours,
    mapsUrl: row.maps_url,
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
export async function getCityServicesByCategory(category: EssentialServiceCategory): Promise<CityService[]> {
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
  return (data ?? []).map(mapCityService);
}

export async function getAllCityServices(): Promise<Record<EssentialServiceCategory, CityService[]>> {
  const categories: EssentialServiceCategory[] = ["hospital", "bank", "supermarket", "pharmacy"];
  const results = await Promise.all(categories.map((c) => getCityServicesByCategory(c)));
  return {
    hospital: results[0],
    bank: results[1],
    supermarket: results[2],
    pharmacy: results[3],
  };
}
