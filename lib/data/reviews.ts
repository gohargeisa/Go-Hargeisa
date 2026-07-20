import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export interface MyReview {
  id: string;
  listingType: "hotel" | "restaurant" | "cafe" | "attraction";
  listingId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  listingName: string;
  href: string;
}

const HREF_SEGMENT: Record<MyReview["listingType"], string> = {
  hotel: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  attraction: "attractions",
};

export async function getReviewsForUser(userId: string): Promise<MyReview[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !reviews?.length) return [];

  const idsByType: Record<MyReview["listingType"], string[]> = {
    hotel: [], restaurant: [], cafe: [], attraction: [],
  };
  for (const r of reviews) idsByType[r.listing_type as MyReview["listingType"]].push(r.listing_id);

  const [hotelRows, restaurantRows, cafeRows, attractionRows] = await Promise.all([
    idsByType.hotel.length ? supabase.from("hotels").select("id, name, slug").in("id", idsByType.hotel) : { data: [] },
    idsByType.restaurant.length ? supabase.from("restaurants").select("id, name, slug").in("id", idsByType.restaurant) : { data: [] },
    idsByType.cafe.length ? supabase.from("cafes").select("id, name, slug").in("id", idsByType.cafe) : { data: [] },
    idsByType.attraction.length ? supabase.from("attractions").select("id, name, slug").in("id", idsByType.attraction) : { data: [] },
  ]);

  const lookup = new Map<string, { name: string; slug: string }>();
  for (const rows of [hotelRows.data ?? [], restaurantRows.data ?? [], cafeRows.data ?? [], attractionRows.data ?? []]) {
    for (const row of rows) lookup.set(row.id, { name: row.name, slug: row.slug });
  }

  return reviews.map((r) => {
    const listingType = r.listing_type as MyReview["listingType"];
    const found = lookup.get(r.listing_id);
    return {
      id: r.id,
      listingType,
      listingId: r.listing_id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      listingName: found?.name ?? "Removed listing",
      href: found ? `/${HREF_SEGMENT[listingType]}/${found.slug}` : "#",
    };
  });
}
