import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapPoints as mockMapPoints } from "@/lib/mock-data";
import type { CityServiceCategory, CityServicePoint, MapPoint } from "@/types";

export async function getMapPoints(): Promise<MapPoint[]> {
  if (!isSupabaseConfigured()) return mockMapPoints;

  const supabase = createPublicClient();

  const [{ data: hotelRows }, { data: restaurantRows }, { data: attractionRows }, { data: otherRows }] =
    await Promise.all([
      supabase.from("hotels").select("id, slug, name, address, lat, lng").eq("status", "published"),
      supabase.from("restaurants").select("id, slug, name, address, lat, lng").eq("status", "published"),
      supabase.from("attractions").select("id, slug, name, address, lat, lng").eq("status", "published"),
      supabase.from("map_points").select("*"),
    ]);

  const points: MapPoint[] = [
    ...(hotelRows ?? []).map((r) => ({ id: r.id, slug: r.slug, name: r.name, address: r.address, category: "hotel" as const, location: { lat: r.lat, lng: r.lng } })),
    ...(restaurantRows ?? []).map((r) => ({ id: r.id, slug: r.slug, name: r.name, address: r.address, category: "restaurant" as const, location: { lat: r.lat, lng: r.lng } })),
    ...(attractionRows ?? []).map((r) => ({ id: r.id, slug: r.slug, name: r.name, address: r.address, category: "attraction" as const, location: { lat: r.lat, lng: r.lng } })),
    ...(otherRows ?? []).map((r) => ({ id: r.id, slug: r.id, name: r.name, address: "", category: r.category as MapPoint["category"], location: { lat: r.lat, lng: r.lng } })),
  ];

  return points;
}

// The `map_points` table's `category` column is constrained to a fixed set
// (see supabase/schema.sql). Only these overlap with the Smart City Map's
// category taxonomy — the rest (pharmacy, gas_station, police, government,
// school, university, airport, parking) have no matching column value yet,
// so they render as empty categories in the UI rather than fake points.
const CITY_SERVICE_DB_CATEGORY: Partial<Record<CityServiceCategory, string>> = {
  hospital: "hospital",
  atm: "atm",
  mosque: "mosque",
  supermarket: "shopping",
};

function toCityServiceCategory(dbCategory: string): CityServiceCategory | null {
  const entry = Object.entries(CITY_SERVICE_DB_CATEGORY).find(([, v]) => v === dbCategory);
  return (entry?.[0] as CityServiceCategory) ?? null;
}

/** Smart City Map data — deliberately separate from getMapPoints() above,
 * which mixes in hotels/restaurants/attractions for the listings map.
 * Combines the legacy `map_points` table (mosques/ATMs/shopping/etc.) with
 * the Phase 2 `services` table (hospitals/pharmacies/dental clinics/banks/
 * ATMs/currency exchange/gas stations/car rentals), whose 8 categories are
 * a strict subset of CityServiceCategory so no mapping is needed. */
export async function getCityServicePoints(): Promise<CityServicePoint[]> {
  if (!isSupabaseConfigured()) {
    return mockMapPoints.flatMap((p) => {
      const category = toCityServiceCategory(p.category);
      return category ? [{ id: p.id, name: p.name, category, location: p.location }] : [];
    });
  }

  const supabase = createPublicClient();
  const [{ data, error }, { data: serviceRows, error: serviceError }] = await Promise.all([
    supabase.from("map_points").select("id, name, category, lat, lng"),
    supabase
      .from("services")
      .select("id, slug, name, category, short_description, address, phone, lat, lng")
      .eq("status", "published"),
  ]);

  if (error && process.env.NODE_ENV === "development") console.error("getCityServicePoints:", error.message);
  if (serviceError && process.env.NODE_ENV === "development")
    console.error("getCityServicePoints (services):", serviceError.message);

  const legacyPoints = (data ?? []).flatMap((row) => {
    const category = toCityServiceCategory(row.category);
    return category
      ? [{ id: row.id, name: row.name, category, location: { lat: row.lat, lng: row.lng } }]
      : [];
  });

  const servicePoints: CityServicePoint[] = (serviceRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category as CityServiceCategory,
    location: { lat: row.lat, lng: row.lng },
    slug: row.slug,
    address: row.address,
    description: row.short_description,
    phone: row.phone ?? undefined,
  }));

  return [...legacyPoints, ...servicePoints];
}
