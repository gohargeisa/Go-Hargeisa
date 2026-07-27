import { ArrowUpRight, Globe, MessageCircle, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/home/reveal";
import { TrackedCtaLink } from "@/components/shared/tracked-cta-link";
import { getBookingHref } from "@/lib/utils/booking-href";
import { normalizeExternalUrl } from "@/lib/utils/normalize-url";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import type { BusinessListingType } from "@/types";

const SECONDARY_CLASS =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-soft active:scale-95 dark:border-white/20 dark:text-white";

/**
 * Quick-action bar shown directly below the listing header — distinct from
 * the fixed mobile bottom bar (components/shared/mobile-booking-bar.tsx),
 * which stays untouched and keeps persisting while scrolling on mobile.
 * This one scrolls away with the page and is visible at every breakpoint.
 * Each button hides itself when its underlying data is missing, reusing the
 * same booking/WhatsApp/URL utilities so the "Book Now" behavior stays
 * identical everywhere it appears. Share is deliberately NOT duplicated
 * here — it already lives in the sticky mobile bottom bar and the desktop
 * sidebar booking card. Reused as-is by the hotel, restaurant, and cafe
 * detail pages via `listingType` + `showPrimary`/`primaryLabel` overrides,
 * so the primary CTA can be "Book Now" (hotel), "Reserve a Table"
 * (reservable restaurants only), or hidden entirely (cafes, which have no
 * booking concept).
 */
export async function HotelActionBar({
  listingType,
  listingId,
  name,
  phone,
  website,
  whatsappFallback,
  showPrimary = true,
  primaryLabel,
}: {
  listingType: BusinessListingType;
  listingId: string;
  name: string;
  phone?: string;
  website?: string;
  whatsappFallback?: string;
  showPrimary?: boolean;
  primaryLabel?: string;
}) {
  const t = await getTranslations("hotelDetail");
  const tc = await getTranslations("common");

  const booking = getBookingHref({ website, phone });
  const whatsappNumber = phone || whatsappFallback;
  const whatsappHref = whatsappNumber
    ? toWhatsAppHref(whatsappNumber, `Hi, I'd like to know more about ${name}.`)
    : undefined;
  const websiteHref = website ? normalizeExternalUrl(website) : undefined;

  return (
    <Reveal delay={0.05}>
      <div className="container-px mx-auto mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-3.5">
        {showPrimary && booking && (
          <a
            href={booking.href}
            target={booking.external ? "_blank" : undefined}
            rel={booking.external ? "noopener noreferrer" : undefined}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-[15px] font-bold text-white shadow-soft transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-primary-700 hover:shadow-card active:scale-95"
          >
            {primaryLabel ?? tc("bookNow")}
            {booking.external && <ArrowUpRight size={16} aria-hidden="true" />}
          </a>
        )}

        {phone && (
          <TrackedCtaLink listingType={listingType} listingId={listingId} eventType="call_click" href={`tel:${phone}`} className={SECONDARY_CLASS}>
            <Phone size={15} aria-hidden="true" />
            {t("call")}
          </TrackedCtaLink>
        )}

        {whatsappHref && (
          <TrackedCtaLink
            listingType={listingType}
            listingId={listingId}
            eventType="whatsapp_click"
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${SECONDARY_CLASS} hover:!border-[#25D366] hover:!text-[#25D366]`}
          >
            <MessageCircle size={15} aria-hidden="true" />
            {t("whatsapp")}
          </TrackedCtaLink>
        )}

        {websiteHref && (
          <TrackedCtaLink
            listingType={listingType}
            listingId={listingId}
            eventType="website_click"
            href={websiteHref}
            target="_blank"
            rel="noopener noreferrer"
            className={SECONDARY_CLASS}
          >
            <Globe size={15} aria-hidden="true" />
            {t("website")}
          </TrackedCtaLink>
        )}
      </div>
    </Reveal>
  );
}
