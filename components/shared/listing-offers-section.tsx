import Image from "next/image";
import { Tag, Ticket } from "lucide-react";
import { formatOfferDiscount } from "@/lib/utils/offer-status";
import type { BusinessOffer } from "@/types";

/**
 * Renders a listing's currently-live offers (already filtered to
 * approved + active + in-date-range by getPublicOffersForListing) — shared
 * by the hotel/restaurant/cafe detail pages so the card markup only exists
 * once. Returns null when there's nothing to show, so callers can render it
 * unconditionally.
 */
export function ListingOffersSection({
  offers,
  title,
  couponLabel,
  validUntilLabel,
}: {
  offers: BusinessOffer[];
  title: string;
  couponLabel: string;
  validUntilLabel: (date: string) => string;
}) {
  if (offers.length === 0) return null;

  return (
    <section id="offers" aria-labelledby="offers-heading" className="scroll-mt-36">
      <h2 id="offers-heading" className="mb-5 font-display text-2xl font-semibold">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {offers.map((offer) => {
          const discountLabel = formatOfferDiscount(offer);
          return (
            <div
              key={offer.id}
              className="flex gap-4 overflow-hidden rounded-xl3 border border-primary/15 bg-primary/[0.03] p-4 dark:border-primary/20 dark:bg-primary/[0.06]"
            >
              {offer.coverImage ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink/5 dark:bg-white/10">
                  <Image src={offer.coverImage} alt={offer.title} fill sizes="64px" className="object-cover" />
                </div>
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Tag size={22} aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{offer.title}</p>
                  {discountLabel && (
                    <span className="rounded-full bg-primary-700 px-2.5 py-0.5 text-xs font-bold text-white">{discountLabel}</span>
                  )}
                </div>
                {offer.description && (
                  <p className="mt-1 text-sm text-ink/65 dark:text-sand/65">{offer.description}</p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-ink/50 dark:text-sand/50">
                  {offer.endsAt && <span>{validUntilLabel(offer.endsAt)}</span>}
                  {offer.couponCode && (
                    <span className="flex items-center gap-1 font-semibold text-primary-700">
                      <Ticket size={12} aria-hidden="true" /> {couponLabel}: {offer.couponCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
