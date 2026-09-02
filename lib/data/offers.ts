import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { mapBusinessOffer } from "./mappers";
import { isOfferLive } from "@/lib/utils/offer-status";
import type { BusinessOffer } from "@/types";

export interface OfferWithListing extends BusinessOffer {
  listingName: string;
  listingSlug: string;
  listingImage: string;
}

/** hotel/restaurant/cafe store their card image in `cover_image`;
 * city_services uses `image` — one map so hydrate can select the right one. */
const IMAGE_COL_BY_TYPE = {
  hotel: "cover_image",
  restaurant: "cover_image",
  cafe: "cover_image",
  city_service: "image",
} as const;
const TABLE_BY_TYPE = { hotel: "hotels", restaurant: "restaurants", cafe: "cafes", city_service: "city_services" } as const;

export type OfferListingType = keyof typeof TABLE_BY_TYPE;

/** Batches the polymorphic listing_id → name/slug/image lookup by listing
 * type (one query per type, not one per offer) — business_offers can't join
 * hotels/restaurants/cafes/city_services directly since one FK can't target
 * four tables. */
async function hydrateWithListingInfo(
  offers: BusinessOffer[],
  supabase: ReturnType<typeof createPublicClient>
): Promise<OfferWithListing[]> {
  const idsByType: Record<OfferListingType, string[]> = { hotel: [], restaurant: [], cafe: [], city_service: [] };
  for (const o of offers) idsByType[o.listingType].push(o.listingId);

  const infoMap = new Map<string, { name: string; slug: string; image: string | null }>();
  await Promise.all(
    (Object.keys(idsByType) as OfferListingType[]).map(async (type) => {
      const ids = idsByType[type];
      if (ids.length === 0) return;
      const imageCol = IMAGE_COL_BY_TYPE[type];
      const { data } = await supabase.from(TABLE_BY_TYPE[type]).select(`id, name, slug, ${imageCol}`).in("id", ids);
      for (const row of (data ?? []) as Array<Record<string, string | null>>) {
        infoMap.set(row.id as string, { name: row.name as string, slug: row.slug as string, image: row[imageCol] });
      }
    })
  );

  return offers.flatMap((o) => {
    const info = infoMap.get(o.listingId);
    if (!info) return [];
    return [{ ...o, listingName: info.name, listingSlug: info.slug, listingImage: info.image ?? "" }];
  });
}

/** A specific listing's currently-live offers — for the hotel/restaurant/
 * cafe/city-service detail pages. RLS already restricts anonymous reads to
 * approved + is_active + a published listing; the isOfferLive filter here
 * additionally enforces the date window (auto-expire, no cron needed). */
export async function getPublicOffersForListing(
  listingType: OfferListingType,
  listingId: string
): Promise<BusinessOffer[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("business_offers")
    .select("*")
    .eq("listing_type", listingType)
    .eq("listing_id", listingId);

  return (data ?? []).map(mapBusinessOffer).filter(isOfferLive);
}

/** Featured + currently-live offers for the homepage, newest first. */
export async function getFeaturedOffersForHomepage(limit = 6): Promise<OfferWithListing[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("business_offers")
    .select("*")
    .eq("featured", true)
    .order("created_at", { ascending: false });

  const live = (data ?? []).map(mapBusinessOffer).filter(isOfferLive).slice(0, limit);
  return hydrateWithListingInfo(live, supabase);
}

/** Admin moderation queue — every offer regardless of status, pending
 * first so the review queue surfaces what needs attention. Uses the
 * cookie-authenticated client; RLS's "Owners manage all offers" policy
 * gates this to the platform admin role. */
export async function getAllOffersForModeration(): Promise<OfferWithListing[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_offers")
    .select("*")
    .order("created_at", { ascending: false });

  const offers = (data ?? []).map(mapBusinessOffer);
  offers.sort((a, b) => {
    if (a.approvalStatus === b.approvalStatus) return 0;
    if (a.approvalStatus === "pending") return -1;
    if (b.approvalStatus === "pending") return 1;
    return 0;
  });
  return hydrateWithListingInfo(offers, supabase as unknown as ReturnType<typeof createPublicClient>);
}
