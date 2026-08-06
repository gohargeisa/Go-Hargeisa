import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { serviceHref } from "@/lib/utils/service-categories";
import { getServiceCategories } from "@/lib/data/categories";

export interface SavedTripItem {
  id: string;
  listingType: "hotel" | "restaurant" | "cafe" | "attraction" | "service";
  listingId: string;
  name: string;
  image: string;
  href: string;
}

export interface SavedTrip {
  id: string;
  title: string;
  notes: string | null;
  createdAt: string;
  items: SavedTripItem[];
}

const HREF_SEGMENT: Partial<Record<SavedTripItem["listingType"], string>> = {
  hotel: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  attraction: "attractions",
};

export async function getSavedTripsForUser(userId: string): Promise<SavedTrip[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: trips, error } = await supabase
    .from("saved_trips")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !trips?.length) return [];

  const { data: items } = await supabase
    .from("saved_trip_items")
    .select("*")
    .in(
      "trip_id",
      trips.map((t) => t.id)
    );

  const idsByType: Record<SavedTripItem["listingType"], string[]> = {
    hotel: [],
    restaurant: [],
    cafe: [],
    attraction: [],
    service: [],
  };
  for (const item of items ?? []) idsByType[item.listing_type as SavedTripItem["listingType"]].push(item.listing_id);

  const [hotelRows, restaurantRows, cafeRows, attractionRows, serviceRows] = await Promise.all([
    idsByType.hotel.length ? supabase.from("hotels").select("id, name, cover_image, slug").in("id", idsByType.hotel) : { data: [] },
    idsByType.restaurant.length
      ? supabase.from("restaurants").select("id, name, cover_image, slug").in("id", idsByType.restaurant)
      : { data: [] },
    idsByType.cafe.length ? supabase.from("cafes").select("id, name, cover_image, slug").in("id", idsByType.cafe) : { data: [] },
    idsByType.attraction.length
      ? supabase.from("attractions").select("id, name, cover_image, slug").in("id", idsByType.attraction)
      : { data: [] },
    idsByType.service.length
      ? supabase.from("services").select("id, name, cover_image, slug, category_id").in("id", idsByType.service)
      : { data: [] },
  ]);

  const serviceCategoryMap = new Map((await getServiceCategories()).map((c) => [c.id, c]));
  const lookup = new Map<string, { name: string; image: string; slug: string; categorySlug?: string }>();
  for (const [rows] of [
    [hotelRows.data ?? []],
    [restaurantRows.data ?? []],
    [cafeRows.data ?? []],
    [attractionRows.data ?? []],
  ] as const) {
    for (const row of rows) lookup.set(row.id, { name: row.name, image: row.cover_image, slug: row.slug });
  }
  for (const row of serviceRows.data ?? []) {
    lookup.set(row.id, {
      name: row.name,
      image: row.cover_image,
      slug: row.slug,
      categorySlug: row.category_id ? serviceCategoryMap.get(row.category_id)?.slug : undefined,
    });
  }

  return trips.map((trip) => ({
    id: trip.id,
    title: trip.title,
    notes: trip.notes,
    createdAt: trip.created_at,
    items: (items ?? [])
      .filter((item) => item.trip_id === trip.id)
      .map((item) => {
        const listingType = item.listing_type as SavedTripItem["listingType"];
        const found = lookup.get(item.listing_id);
        const href = !found
          ? "#"
          : listingType === "service" && found.categorySlug
            ? serviceHref(found.categorySlug, found.slug)
            : `/${HREF_SEGMENT[listingType]}/${found.slug}`;
        return {
          id: item.id,
          listingType,
          listingId: item.listing_id,
          name: found?.name ?? "Removed listing",
          image: found?.image ?? "",
          href,
        };
      }),
  }));
}
