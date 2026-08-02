import { Globe, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { AddToTripButton } from "@/components/shared/add-to-trip-button";
import { ShareButton } from "@/components/shared/share-button";
import { HotelBookNowButton } from "@/components/shared/hotel-book-now-button";
import { normalizeExternalUrl } from "@/lib/utils/normalize-url";
import { hasMeaningfulPrice } from "@/lib/utils/price-range";
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
}) {
  const t = await getTranslations("listings");
  const th = await getTranslations("hotelDetail");
  const tNav = await getTranslations("nav");
  const websiteHref = website ? normalizeExternalUrl(website) : undefined;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
          {t("startingFrom")}
        </p>
        {hasMeaningfulPrice(priceRange) ? (
          <p className="font-display text-2xl font-bold text-primary">
            {priceRange}
            <span className="ms-1 text-sm font-medium text-ink/50 dark:text-sand/50">{t("perNight")}</span>
          </p>
        ) : (
          <p className="font-display text-lg font-semibold text-ink/35 dark:text-sand/40">{th("contactForPricing")}</p>
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
        className="flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-semibold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-card active:scale-95"
      />

      {(phone || website) && (
        <div className="space-y-2.5 rounded-2xl border border-ink/8 p-4 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
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
    </div>
  );
}
