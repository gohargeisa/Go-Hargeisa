import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapPoints as mockMapPoints } from "@/lib/mock-data";
import type { MapPoint } from "@/types";

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
