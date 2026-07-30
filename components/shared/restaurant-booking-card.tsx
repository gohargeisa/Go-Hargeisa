import { ArrowUpRight, Clock, Globe, Phone } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { AddToTripButton } from "@/components/shared/add-to-trip-button";
import { ShareButton } from "@/components/shared/share-button";
import { PrimaryButton } from "@/components/shared/buttons";
import { normalizeExternalUrl } from "@/lib/utils/normalize-url";
import { hasMeaningfulPrice } from "@/lib/utils/price-range";

export function RestaurantBookingCard({
  restaurantId,
  name,
  priceRange,
  priceLabel,
  openingHours,
  hoursLabel,
  reservable,
  reserveLabel,
  phone,
  website,
  locale,
  contactLabel,
  visitWebsiteLabel,
}: {
  restaurantId: string;
  name: string;
  priceRange?: string;
  priceLabel: string;
  openingHours?: string;
  hoursLabel: string;
  reservable?: boolean;
  reserveLabel: string;
  phone?: string;
  website?: string;
  locale: Locale;
  contactLabel: string;
  visitWebsiteLabel: string;
}) {
  const websiteHref = website ? normalizeExternalUrl(website) : undefined;

  return (
    <div className="space-y-5">
      {hasMeaningfulPrice(priceRange) && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
            {priceLabel}
          </p>
          <p className="font-display text-2xl font-bold text-primary">{priceRange}</p>
        </div>
      )}

      {openingHours && (
        <div className="flex items-start gap-2.5 text-sm text-ink/70 dark:text-sand/70">
          <Clock size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
              {hoursLabel}
            </p>
            {openingHours}
          </div>
        </div>
      )}

      {reservable &&
        (websiteHref ? (
          <PrimaryButton href={websiteHref} external size="lg" fullWidth>
            {reserveLabel}
            <ArrowUpRight size={15} aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </PrimaryButton>
        ) : phone ? (
          <PrimaryButton href={`tel:${phone}`} size="lg" fullWidth>
            {reserveLabel}
          </PrimaryButton>
        ) : (
          <PrimaryButton disabled size="lg" fullWidth>
            {reserveLabel}
          </PrimaryButton>
        ))}

      {(phone || website) && (
        <div className="space-y-2.5 rounded-2xl border border-ink/8 p-4 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
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
    </div>
  );
}
