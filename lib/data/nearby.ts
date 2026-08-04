import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { filterHotelsForPresentation } from "@/lib/config/features";
import { distanceKm } from "@/lib/utils/geo";

export type NearbyListingType = "hotel" | "restaurant" | "cafe" | "attraction" | "event" | "city_service";

export interface NearbyListing {
  type: NearbyListingType;
  id: string;
  slug: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
}

const TABLE_BY_TYPE: Record<NearbyListingType, string> = {
  hotel: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  attraction: "attractions",
  event: "events",
  city_service: "city_services",
};

/** Every table shares a `name` column except `events`, which uses `title`. */
const NAME_COLUMN_BY_TYPE: Record<NearbyListingType, "name" | "title"> = {
  hotel: "name",
  restaurant: "name",
  cafe: "name",
  attraction: "name",
  event: "title",
  city_service: "name",
};

/** Every table shares a `cover_image` column except `city_services`, which
 * uses `image`. */
const IMAGE_COLUMN_BY_TYPE: Record<NearbyListingType, "cover_image" | "image"> = {
  hotel: "cover_image",
  restaurant: "cover_image",
  cafe: "cover_image",
  attraction: "cover_image",
  event: "cover_image",
  city_service: "image",
};

export { distanceKm };

/**
 * Cross-category, distance-sorted "nearby places" — genuinely new (the only
 * prior "nearby" concept was two hand-curated hotel<->attraction junction
 * tables, kept separately as editorial overrides, see
 * lib/data/related-listings.ts). Data volume across every listing table is
 * small today, so this does a cheap SQL bounding-box pre-filter (avoids a
 * full table scan) followed by an exact Haversine sort in JS, rather than
 * pulling in a Postgres geo extension — revisit if volume grows enough for
 * the bounding box itself to matter.
 */
export async function getNearbyListings({
  lat,
  lng,
  excludeType,
  excludeId,
  radiusKm = 10,
  limit = 8,
  types = ["hotel", "restaurant", "cafe", "attraction"],
}: {
  lat: number;
  lng: number;
  excludeType: NearbyListingType;
  excludeId: string;
  radiusKm?: number;
  limit?: number;
  types?: NearbyListingType[];
}): Promise<NearbyListing[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180) || 1);

  const queries = types.map((type) =>
    supabase
      .from(TABLE_BY_TYPE[type])
      .select(`id, slug, ${NAME_COLUMN_BY_TYPE[type]}, ${IMAGE_COLUMN_BY_TYPE[type]}, lat, lng, rating, review_count`)
      .eq("status", "published")
      .gte("lat", lat - latDelta)
      .lte("lat", lat + latDelta)
      .gte("lng", lng - lngDelta)
      .lte("lng", lng + lngDelta)
  );

  const results = await Promise.all(queries);

  const listings: NearbyListing[] = [];
  types.forEach((type, i) => {
    const rows = (results[i].data ?? []) as Record<string, unknown>[];
    for (const row of rows as unknown as {
      id: string;
      slug: string;
      name?: string;
      title?: string;
      cover_image?: string;
      image?: string;
      lat: number;
      lng: number;
      rating: number;
      review_count: number;
    }[]) {
      if (type === excludeType && row.id === excludeId) continue;
      const d = distanceKm(lat, lng, row.lat, row.lng);
      if (d <= radiusKm) {
        listings.push({
          type,
          id: row.id,
          slug: row.slug,
          name: (row.name ?? row.title) as string,
          image: (row.cover_image ?? row.image) as string,
          rating: Number(row.rating),
          reviewCount: row.review_count,
          distanceKm: d,
        });
      }
    }
  });

  // Hotel presentation mode restricts every public surface to one hotel —
  // "nearby" is no exception, or it would link to a hotel the site 404s.
  const visible = listings.filter(
    (l) => l.type !== "hotel" || filterHotelsForPresentation([{ slug: l.slug }]).length > 0
  );

  visible.sort((a, b) => a.distanceKm - b.distanceKm);
  return visible.slice(0, limit);
}

/**
 * Folds hand-curated recommendations (the two junction tables,
 * hotel_nearby_attractions / attraction_nearby_{restaurants,hotels}) into
 * one real-distance "Nearby Places" list instead of showing them as a
 * separate section — a hotel page previously had both a curated "Nearby
 * Attractions" block AND (after this initiative) a geo "Nearby Places"
 * block, which was exactly the redundant clutter this app's design
 * principles rule out. Curated picks are guaranteed to appear even if
 * outside the geo query's radius; everything is re-sorted by actual
 * distance afterward so the list still reads as "nearest first," not
 * "curated first."
 */
export function mergeCuratedNearby(
  curated: {
    type: NearbyListingType;
    id: string;
    slug: string;
    name: string;
    image: string;
    rating: number;
    reviewCount: number;
    location: { lat: number; lng: number };
  }[],
  geoResults: NearbyListing[],
  origin: { lat: number; lng: number },
  limit = 8
): NearbyListing[] {
  const curatedListings: NearbyListing[] = curated.map((c) => ({
    type: c.type,
    id: c.id,
    slug: c.slug,
    name: c.name,
    image: c.image,
    rating: c.rating,
    reviewCount: c.reviewCount,
    distanceKm: distanceKm(origin.lat, origin.lng, c.location.lat, c.location.lng),
  }));
  const seen = new Set(curatedListings.map((l) => `${l.type}-${l.id}`));
  const merged = [...curatedListings, ...geoResults.filter((l) => !seen.has(`${l.type}-${l.id}`))];
  merged.sort((a, b) => a.distanceKm - b.distanceKm);
  return merged.slice(0, limit);
}
