import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { serviceHref } from "@/lib/utils/service-categories";
import { getServiceCategories } from "@/lib/data/categories";
import { mapReview } from "./mappers";
import type { Review, PolymorphicListingType } from "@/types";

/** The signed-in visitor's own review for a specific listing, if any — used
 * by the detail-page review form to switch from "leave a review" to "edit
 * your review" instead of letting them hit the one-review-per-listing
 * unique constraint blind. Returns null when signed out or not reviewed. */
export async function getMyReviewForListing(
  listingType: PolymorphicListingType,
  listingId: string
): Promise<Review | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", user.id)
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .maybeSingle();

  return data ? mapReview(data as never) : null;
}

export interface MyReview {
  id: string;
  listingType: "hotel" | "restaurant" | "cafe" | "attraction" | "service";
  listingId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  listingName: string;
  href: string;
}

const HREF_SEGMENT: Partial<Record<MyReview["listingType"], string>> = {
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
    hotel: [], restaurant: [], cafe: [], attraction: [], service: [],
  };
  for (const r of reviews) idsByType[r.listing_type as MyReview["listingType"]].push(r.listing_id);

  const [hotelRows, restaurantRows, cafeRows, attractionRows, serviceRows] = await Promise.all([
    idsByType.hotel.length ? supabase.from("hotels").select("id, name, slug").in("id", idsByType.hotel) : { data: [] },
    idsByType.restaurant.length ? supabase.from("restaurants").select("id, name, slug").in("id", idsByType.restaurant) : { data: [] },
    idsByType.cafe.length ? supabase.from("cafes").select("id, name, slug").in("id", idsByType.cafe) : { data: [] },
    idsByType.attraction.length ? supabase.from("attractions").select("id, name, slug").in("id", idsByType.attraction) : { data: [] },
    idsByType.service.length ? supabase.from("services").select("id, name, slug, category_id").in("id", idsByType.service) : { data: [] },
  ]);

  const serviceCategoryMap = new Map((await getServiceCategories()).map((c) => [c.id, c]));
  const lookup = new Map<string, { name: string; slug: string; categorySlug?: string }>();
  for (const rows of [hotelRows.data ?? [], restaurantRows.data ?? [], cafeRows.data ?? [], attractionRows.data ?? []]) {
    for (const row of rows) lookup.set(row.id, { name: row.name, slug: row.slug });
  }
  for (const row of serviceRows.data ?? []) {
    lookup.set(row.id, { name: row.name, slug: row.slug, categorySlug: row.category_id ? serviceCategoryMap.get(row.category_id)?.slug : undefined });
  }

  return reviews.map((r) => {
    const listingType = r.listing_type as MyReview["listingType"];
    const found = lookup.get(r.listing_id);
    const href = !found
      ? "#"
      : listingType === "service" && found.categorySlug
        ? serviceHref(found.categorySlug, found.slug)
        : `/${HREF_SEGMENT[listingType]}/${found.slug}`;
    return {
      id: r.id,
      listingType,
      listingId: r.listing_id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      listingName: found?.name ?? "Removed listing",
      href,
    };
  });
}

export interface ReportedReview extends Review {
  listingType: MyReview["listingType"];
  listingId: string;
  listingName: string;
  href: string;
}

/** Admin moderation queue — every review flagged by a business owner via
 * reportReview (lib/actions/business.ts), across all listing types. Same
 * batched polymorphic lookup as getReviewsForUser above. */
export async function getReportedReviewsForModeration(): Promise<ReportedReview[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*, profiles(full_name)")
    .eq("is_reported", true)
    .order("created_at", { ascending: false });

  if (error || !reviews?.length) return [];

  const idsByType: Record<MyReview["listingType"], string[]> = {
    hotel: [], restaurant: [], cafe: [], attraction: [], service: [],
  };
  for (const r of reviews) idsByType[r.listing_type as MyReview["listingType"]].push(r.listing_id);

  const [hotelRows, restaurantRows, cafeRows, attractionRows, serviceRows] = await Promise.all([
    idsByType.hotel.length ? supabase.from("hotels").select("id, name, slug").in("id", idsByType.hotel) : { data: [] },
    idsByType.restaurant.length ? supabase.from("restaurants").select("id, name, slug").in("id", idsByType.restaurant) : { data: [] },
    idsByType.cafe.length ? supabase.from("cafes").select("id, name, slug").in("id", idsByType.cafe) : { data: [] },
    idsByType.attraction.length ? supabase.from("attractions").select("id, name, slug").in("id", idsByType.attraction) : { data: [] },
    idsByType.service.length ? supabase.from("services").select("id, name, slug, category_id").in("id", idsByType.service) : { data: [] },
  ]);

  const serviceCategoryMap = new Map((await getServiceCategories()).map((c) => [c.id, c]));
  const lookup = new Map<string, { name: string; slug: string; categorySlug?: string }>();
  for (const rows of [hotelRows.data ?? [], restaurantRows.data ?? [], cafeRows.data ?? [], attractionRows.data ?? []]) {
    for (const row of rows) lookup.set(row.id, { name: row.name, slug: row.slug });
  }
  for (const row of serviceRows.data ?? []) {
    lookup.set(row.id, { name: row.name, slug: row.slug, categorySlug: row.category_id ? serviceCategoryMap.get(row.category_id)?.slug : undefined });
  }

  return reviews.map((r) => {
    const listingType = r.listing_type as MyReview["listingType"];
    const found = lookup.get(r.listing_id);
    const href = !found
      ? "#"
      : listingType === "service" && found.categorySlug
        ? serviceHref(found.categorySlug, found.slug)
        : `/${HREF_SEGMENT[listingType]}/${found.slug}`;
    return {
      ...mapReview(r, (r as { profiles?: { full_name?: string } }).profiles?.full_name ?? "Guest"),
      listingType,
      listingId: r.listing_id,
      listingName: found?.name ?? "Removed listing",
      href,
    };
  });
}
