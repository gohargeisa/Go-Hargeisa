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

const TABLE_BY_TYPE = { hotel: "hotels", restaurant: "restaurants", cafe: "cafes" } as const;

/** Batches the polymorphic listing_id → name/slug/image lookup by listing
 * type (3 queries total, not one per offer) — business_offers can't join
 * hotels/restaurants/cafes directly since one FK can't target three tables. */
async function hydrateWithListingInfo(
  offers: BusinessOffer[],
  supabase: ReturnType<typeof createPublicClient>
): Promise<OfferWithListing[]> {
  const idsByType: Record<"hotel" | "restaurant" | "cafe", string[]> = { hotel: [], restaurant: [], cafe: [] };
  for (const o of offers) idsByType[o.listingType].push(o.listingId);

  const infoMap = new Map<string, { name: string; slug: string; cover_image: string }>();
  await Promise.all(
    (Object.keys(idsByType) as (keyof typeof idsByType)[]).map(async (type) => {
      const ids = idsByType[type];
      if (ids.length === 0) return;
      const { data } = await supabase.from(TABLE_BY_TYPE[type]).select("id, name, slug, cover_image").in("id", ids);
      for (const row of data ?? []) infoMap.set(row.id, row);
    })
  );

  return offers.flatMap((o) => {
    const info = infoMap.get(o.listingId);
    if (!info) return [];
    return [{ ...o, listingName: info.name, listingSlug: info.slug, listingImage: info.cover_image }];
  });
}

/** A specific listing's currently-live offers — for the hotel/restaurant/
 * cafe detail pages. RLS already restricts anonymous reads to
 * approved + is_active + a published listing; the isOfferLive filter here
 * additionally enforces the date window (auto-expire, no cron needed). */
export async function getPublicOffersForListing(
  listingType: "hotel" | "restaurant" | "cafe",
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
