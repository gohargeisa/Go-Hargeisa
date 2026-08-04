import { ListingCard } from "@/components/shared/listing-card";
import type { NearbyListing } from "@/lib/data/nearby";
import type { Locale } from "@/lib/i18n/config";

const HREF_SEGMENT: Record<NearbyListing["type"], string> = {
  hotel: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  attraction: "attractions",
  event: "events",
  city_service: "city-services",
};

/**
 * Cross-category "Nearby Places" row — distinct from each detail page's
 * existing same-category "you may also like" section (see
 * components/shared/related-listings.tsx), which answers a different
 * question ("similar restaurants") than this one ("what else is near this
 * hotel"). Reuses the same ListingCard every other listing grid uses, just
 * with the distance as the subtitle instead of an address.
 */
export function NearbyListings({
  listings,
  locale,
  distanceLabel,
}: {
  listings: NearbyListing[];
  locale: Locale;
  /** e.g. (km) => `${km} km away` — caller-supplied so this stays
   * translated without this component needing its own namespace. */
  distanceLabel: (km: string) => string;
}) {
  if (listings.length === 0) return null;

  return (
    <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
      {listings.map((l) => (
        <div key={`${l.type}-${l.id}`} className="min-w-[272px] sm:min-w-0">
          <ListingCard
            href={`/${locale}/${HREF_SEGMENT[l.type]}/${l.slug}`}
            image={l.image}
            title={l.name}
            subtitle={distanceLabel(l.distanceKm < 1 ? l.distanceKm.toFixed(1) : l.distanceKm.toFixed(0))}
            rating={l.rating}
            reviewCount={l.reviewCount}
            listingType={l.type}
            listingId={l.id}
            locale={locale}
          />
        </div>
      ))}
    </div>
  );
}
