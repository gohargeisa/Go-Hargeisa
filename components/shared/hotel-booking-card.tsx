import { ArrowUpRight, Globe, Phone } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { AddToTripButton } from "@/components/shared/add-to-trip-button";
import { ShareButton } from "@/components/shared/share-button";

export function HotelBookingCard({
  hotelId,
  name,
  priceRange,
  phone,
  website,
  locale,
}: {
  hotelId: string;
  name: string;
  priceRange?: string;
  phone?: string;
  website?: string;
  locale: Locale;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
          Starting from
        </p>
        {priceRange ? (
          <p className="font-display text-2xl font-bold text-primary">
            {priceRange}
            <span className="ms-1 text-sm font-medium text-ink/50 dark:text-sand/50">/night</span>
          </p>
        ) : (
          <p className="font-display text-lg font-semibold text-ink/35 dark:text-sand/40">Price on request</p>
        )}
      </div>

      {website ? (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          Book Now
          <ArrowUpRight size={15} aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : phone ? (
        <a
          href={`tel:${phone}`}
          className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          Book Now
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-full bg-primary/40 text-sm font-semibold text-white/80"
        >
          Book Now
        </button>
      )}

      {(phone || website) && (
        <div className="space-y-2.5 rounded-2xl border border-ink/8 p-4 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
            Contact Hotel
          </p>
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-2.5 text-sm transition-colors hover:text-primary">
              <Phone size={15} className="shrink-0" aria-hidden="true" /> {phone}
            </a>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm transition-colors hover:text-primary"
            >
              <Globe size={15} className="shrink-0" aria-hidden="true" /> Visit website
            </a>
          )}
        </div>
      )}

      <AddToTripButton locale={locale} listingType="hotel" listingId={hotelId} />
      <ShareButton title={name} />
    </div>
  );
}
