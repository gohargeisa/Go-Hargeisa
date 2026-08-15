import { ArrowUpRight, CalendarDays, Globe, Mail, MessageCircle, Phone, ShoppingBag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/home/reveal";
import { TrackedCtaLink } from "@/components/shared/tracked-cta-link";
import { ClaimBusinessButton } from "@/components/shared/claim-business-button";
import { HotelBookNowButton } from "@/components/shared/hotel-book-now-button";
import { TableReservationButton } from "@/components/shared/table-reservation-button";
import { getBookingHref } from "@/lib/utils/booking-href";
import { normalizeExternalUrl } from "@/lib/utils/normalize-url";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import type { BusinessListingType, HotelRoom } from "@/types";
import type { HotelBookingCta } from "@/lib/utils/booking-cta";
import type { OrderCta } from "@/lib/utils/restaurant-cta";
import type { Locale } from "@/lib/i18n/config";

const SECONDARY_CLASS =
  "inline-flex h-12 shrink-0 snap-start items-center justify-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-soft active:scale-95 dark:border-white/20 dark:text-white";

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
 * so the primary CTA can be "Book Now" (hotel), "Order Now" (order-first
 * restaurants, see lib/utils/restaurant-cta.ts), "Reserve a Table" (every
 * other reservable restaurant/cafe), or hidden entirely (cafes/hotels with
 * no booking concept). When a business supports both ordering and table
 * reservations, Reserve a Table demotes to a secondary action instead of
 * disappearing — never hardcoded per listing type, always driven by the
 * real capability flags/fields the caller passes in.
 */
const PRIMARY_CLASS =
  "inline-flex h-12 shrink-0 snap-start items-center justify-center gap-2 rounded-full bg-primary-700 px-8 text-[15px] font-bold text-white shadow-soft transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-primary-800 hover:shadow-card active:scale-95";

export async function HotelActionBar({
  locale,
  listingType,
  listingId,
  hotelSlug,
  name,
  rating,
  phone,
  website,
  email,
  whatsappFallback,
  showPrimary = true,
  primaryLabel,
  reserveLabel,
  bookingCta,
  rooms,
  reservable,
  orderCta,
}: {
  locale: Locale;
  listingType: BusinessListingType;
  listingId: string;
  /** Hotel-only: when set alongside bookingCta, the primary "Book Now"
   * navigates to the dedicated booking page instead of opening the modal. */
  hotelSlug?: string;
  name: string;
  rating?: number;
  phone?: string;
  website?: string;
  email?: string;
  whatsappFallback?: string;
  showPrimary?: boolean;
  primaryLabel?: string;
  /** Label for the Reserve a Table button specifically — used whether it
   * renders as the primary action (no orderCta) or demoted to a secondary
   * action (orderCta present). Falls back to primaryLabel, then bookNow. */
  reserveLabel?: string;
  /** Hotel-only: when set, the primary button uses the hotel's configured
   * booking mode (Go Hargeisa request modal vs external redirect) instead
   * of the generic website/phone fallback below. */
  bookingCta?: HotelBookingCta;
  rooms?: HotelRoom[];
  /** Restaurant/cafe only: when true, the reservation request flow
   * (TableReservationButton) is available — primary when the business has
   * no orderCta, secondary (alongside "Order Now") when it does. */
  reservable?: boolean;
  /** Restaurant only, see lib/utils/restaurant-cta.ts: when set, "Order Now"
   * becomes the primary CTA instead of Reserve a Table/the generic fallback. */
  orderCta?: OrderCta;
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
      <div className="container-px mx-auto mt-6 flex snap-x snap-proximity items-center gap-3 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0 sm:gap-3.5">
        {showPrimary && bookingCta && (
          <HotelBookNowButton
            cta={bookingCta}
            locale={locale}
            hotelId={listingId}
            hotelName={name}
            hotelRating={rating}
            hotelSlug={hotelSlug}
            rooms={rooms}
            className={PRIMARY_CLASS}
            iconSize={16}
          />
        )}

        {showPrimary && !bookingCta && orderCta && (
          <a
            href={orderCta.href}
            target={orderCta.external ? "_blank" : undefined}
            rel={orderCta.external ? "noopener noreferrer" : undefined}
            className={PRIMARY_CLASS}
          >
            <ShoppingBag size={16} aria-hidden="true" />
            {tc("orderNow")}
          </a>
        )}

        {showPrimary && !bookingCta && !orderCta && reservable && (
          <TableReservationButton
            listingType={listingType as "restaurant" | "cafe"}
            listingId={listingId}
            businessName={name}
            locale={locale}
            label={reserveLabel ?? primaryLabel ?? tc("bookNow")}
            className={PRIMARY_CLASS}
          />
        )}

        {/* Reservations remain available as a secondary action when a
            business supports both ordering and table booking, instead of
            disappearing once Order Now takes the primary slot. */}
        {orderCta && reservable && (
          <TableReservationButton
            listingType={listingType as "restaurant" | "cafe"}
            listingId={listingId}
            businessName={name}
            locale={locale}
            label={reserveLabel ?? primaryLabel ?? tc("bookNow")}
            icon={<CalendarDays size={15} aria-hidden="true" />}
            className={SECONDARY_CLASS}
          />
        )}

        {showPrimary && !bookingCta && !orderCta && !reservable && booking && (
          <a
            href={booking.href}
            target={booking.external ? "_blank" : undefined}
            rel={booking.external ? "noopener noreferrer" : undefined}
            className={PRIMARY_CLASS}
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

        {email && (
          <a href={`mailto:${email}`} className={SECONDARY_CLASS}>
            <Mail size={15} aria-hidden="true" />
            {t("email")}
          </a>
        )}

        <ClaimBusinessButton listingType={listingType} listingId={listingId} className={SECONDARY_CLASS} />
      </div>
    </Reveal>
  );
}
