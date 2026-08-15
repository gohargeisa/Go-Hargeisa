import { Clock, Globe, Phone, ShoppingBag } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { AddToTripButton } from "@/components/shared/add-to-trip-button";
import { ShareButton } from "@/components/shared/share-button";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { TableReservationButton } from "@/components/shared/table-reservation-button";
import { normalizeExternalUrl } from "@/lib/utils/normalize-url";
import { hasMeaningfulPrice } from "@/lib/utils/price-range";
import type { OrderCta } from "@/lib/utils/restaurant-cta";

export function RestaurantBookingCard({
  restaurantId,
  name,
  priceRange,
  priceLabel,
  openingHours,
  hoursLabel,
  reservable,
  reserveLabel,
  orderCta,
  orderLabel,
  phone,
  website,
  locale,
  contactLabel,
  visitWebsiteLabel,
  initiallyFavorited = false,
  favoriteCount,
  addFavoriteLabel,
  removeFavoriteLabel,
}: {
  restaurantId: string;
  name: string;
  priceRange?: string;
  priceLabel: string;
  openingHours?: string;
  hoursLabel: string;
  reservable?: boolean;
  reserveLabel: string;
  /** See lib/utils/restaurant-cta.ts — when set, "Order Now" is the primary
   * action in this card and Reserve a Table (if also supported) demotes to
   * a secondary, outline-styled button instead of disappearing. */
  orderCta?: OrderCta;
  orderLabel?: string;
  phone?: string;
  website?: string;
  locale: Locale;
  contactLabel: string;
  visitWebsiteLabel: string;
  initiallyFavorited?: boolean;
  favoriteCount?: number;
  addFavoriteLabel: string;
  removeFavoriteLabel: string;
}) {
  const websiteHref = website ? normalizeExternalUrl(website) : undefined;

  return (
    <div className="space-y-5">
      {hasMeaningfulPrice(priceRange) && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/70 dark:text-sand/70">
            {priceLabel}
          </p>
          <p className="font-display text-2xl font-bold text-primary-700">{priceRange}</p>
        </div>
      )}

      {openingHours && (
        <div className="flex items-start gap-2.5 text-sm text-ink/70 dark:text-sand/70">
          <Clock size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/70 dark:text-sand/70">
              {hoursLabel}
            </p>
            {openingHours}
          </div>
        </div>
      )}

      {orderCta && (
        <a
          href={orderCta.href}
          target={orderCta.external ? "_blank" : undefined}
          rel={orderCta.external ? "noopener noreferrer" : undefined}
          className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary-700 text-[15px] font-semibold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-95"
        >
          <ShoppingBag size={16} aria-hidden="true" />
          {orderLabel}
        </a>
      )}

      {reservable && (
        <TableReservationButton
          listingType="restaurant"
          listingId={restaurantId}
          businessName={name}
          locale={locale}
          label={reserveLabel}
          className={
            orderCta
              ? "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-ink/15 text-sm font-semibold text-ink transition-all duration-200 hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
              : "group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary-700 text-[15px] font-semibold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-95"
          }
        />
      )}

      {(phone || website) && (
        <div className="space-y-2.5 rounded-2xl border border-ink/8 p-4 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/70 dark:text-sand/70">
            {contactLabel}
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
              <Globe size={15} className="shrink-0" aria-hidden="true" /> {visitWebsiteLabel}
            </a>
          )}
        </div>
      )}

      <AddToTripButton locale={locale} listingType="restaurant" listingId={restaurantId} />
      <ShareButton title={name} />
      <FavoriteButton
        listingType="restaurant"
        listingId={restaurantId}
        locale={locale}
        initiallyFavorited={initiallyFavorited}
        count={favoriteCount}
        showSpinner={false}
        size={15}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
        addLabel={addFavoriteLabel}
        removeLabel={removeFavoriteLabel}
      />
    </div>
  );
}
