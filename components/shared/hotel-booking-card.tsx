import { Globe, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { AddToTripButton } from "@/components/shared/add-to-trip-button";
import { ShareButton } from "@/components/shared/share-button";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { HotelBookNowButton } from "@/components/shared/hotel-book-now-button";
import { normalizeExternalUrl } from "@/lib/utils/normalize-url";
import { hasMeaningfulPrice } from "@/lib/utils/price-range";
import { getStartingPrice } from "@/lib/utils/starting-price";
import type { HotelBookingCta } from "@/lib/utils/booking-cta";
import type { HotelRoom } from "@/types";

export async function HotelBookingCard({
  hotelId,
  hotelSlug,
  name,
  rating,
  priceRange,
  phone,
  website,
  locale,
  bookingCta,
  rooms,
  initiallyFavorited = false,
  favoriteCount,
}: {
  hotelId: string;
  hotelSlug?: string;
  name: string;
  rating?: number;
  priceRange?: string;
  phone?: string;
  website?: string;
  locale: Locale;
  bookingCta: HotelBookingCta;
  rooms?: HotelRoom[];
  initiallyFavorited?: boolean;
  favoriteCount?: number;
}) {
  const t = await getTranslations("listings");
  const th = await getTranslations("hotelDetail");
  const tNav = await getTranslations("nav");
  const websiteHref = website ? normalizeExternalUrl(website) : undefined;
  // Real room prices (see lib/utils/starting-price.ts) take priority over
  // `priceRange` (just a "$"/"$$"/"$$$" tier symbol, not an actual price) —
  // this is what previously let the room cards show real prices while this
  // sidebar still said "Contact for pricing" for the same hotel.
  const startingPrice = getStartingPrice(
    rooms,
    (r) => r.pricePerNight,
    (r) => r.isAvailable !== false
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/70 dark:text-sand/70">
          {t("startingFrom")}
        </p>
        {startingPrice != null ? (
          <p className="font-display text-2xl font-bold text-primary-700">
            ${startingPrice}
            <span className="ms-1 text-sm font-medium text-ink/50 dark:text-sand/50">{t("perNight")}</span>
          </p>
        ) : hasMeaningfulPrice(priceRange) ? (
          <p className="font-display text-2xl font-bold text-primary-700">
            {priceRange}
            <span className="ms-1 text-sm font-medium text-ink/50 dark:text-sand/50">{t("perNight")}</span>
          </p>
        ) : (
          <p className="font-display text-lg font-semibold text-ink/70 dark:text-sand/70">{th("contactForPricing")}</p>
        )}
      </div>

      <HotelBookNowButton
        cta={bookingCta}
        locale={locale}
        hotelId={hotelId}
        hotelName={name}
        hotelRating={rating}
        hotelSlug={hotelSlug}
        rooms={rooms}
        className="flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-primary-700 text-sm font-semibold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-95"
      />

      {(phone || website) && (
        <div className="space-y-2.5 rounded-2xl border border-ink/8 p-4 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/70 dark:text-sand/70">
            {tNav("contact")}
          </p>
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-2.5 text-sm transition-colors hover:text-primary">
              <Phone size={15} className="shrink-0" aria-hidden="true" /> {phone}
            </a>
          )}
          {websiteHref && (
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm transition-colors hover:text-primary"
            >
              <Globe size={15} className="shrink-0" aria-hidden="true" /> {th("website")}
            </a>
          )}
        </div>
      )}

      <AddToTripButton locale={locale} listingType="hotel" listingId={hotelId} />
      <ShareButton title={name} />
      <FavoriteButton
        listingType="hotel"
        listingId={hotelId}
        locale={locale}
        initiallyFavorited={initiallyFavorited}
        count={favoriteCount}
        showSpinner={false}
        size={15}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
        addLabel={t("addToFavorites", { name })}
        removeLabel={t("removeFromFavorites", { name })}
      />
    </div>
  );
}
