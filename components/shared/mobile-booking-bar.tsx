"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Check, MessageCircle, Navigation, Phone, Share2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getBookingHref } from "@/lib/utils/booking-href";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { HotelBookNowButton } from "@/components/shared/hotel-book-now-button";
import { TableReservationButton } from "@/components/shared/table-reservation-button";
import type { HotelBookingCta } from "@/lib/utils/booking-cta";
import type { BusinessListingType, HotelRoom } from "@/types";

const ICON_BUTTON_CLASS =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink/70 transition-all duration-150 hover:bg-ink/5 hover:text-primary active:scale-90 dark:text-white/80 dark:hover:bg-white/10";

/**
 * Compact mobile bottom action bar (WhatsApp, Call, Share, Save, primary
 * CTA) shared by the hotel, restaurant, and cafe detail pages — replacing
 * the restaurant/cafe pages' previous "price strip + open a bottom sheet"
 * pattern so all three listing types share one mobile booking experience.
 * `showPrimary` hides the right-aligned pill entirely for listing types/
 * states with no booking concept (cafes, non-reservable restaurants);
 * `primaryLabel` lets each type word the pill correctly ("Book Now" vs
 * "Reserve a Table"). `env(safe-area-inset-bottom)` keeps the bar clear of
 * the home indicator on notched iPhones (app/[locale]/layout.tsx sets
 * viewport-fit: "cover" so that value is actually non-zero there).
 */
export function MobileBookingBar({
  listingType,
  listingId,
  name,
  phone,
  website,
  whatsappFallback,
  directionsHref,
  locale,
  initiallyFavorited = false,
  showPrimary = true,
  primaryLabel,
  bookingCta,
  rooms,
  reservable,
}: {
  listingType: BusinessListingType;
  listingId: string;
  name: string;
  phone?: string;
  website?: string;
  /** site_settings.whatsapp_number — used only when the listing has no phone of its own. */
  whatsappFallback?: string;
  /** Precomputed by the caller via lib/utils/google-maps.ts#resolveDirectionsUrl — every detail page already builds this for its own "Get Directions" button, so it's just passed through here rather than recomputed. */
  directionsHref?: string;
  locale: Locale;
  initiallyFavorited?: boolean;
  showPrimary?: boolean;
  primaryLabel?: string;
  /** Hotel-only: see components/shared/hotel-action-bar.tsx for the same prop. */
  bookingCta?: HotelBookingCta;
  rooms?: HotelRoom[];
  /** Restaurant/cafe only: see components/shared/hotel-action-bar.tsx for the same prop. */
  reservable?: boolean;
}) {
  const t = useTranslations("hotelDetail");
  const [copied, setCopied] = useState(false);

  const booking = getBookingHref({ website, phone });
  const whatsappNumber = phone || whatsappFallback;
  const whatsappHref = whatsappNumber
    ? toWhatsAppHref(whatsappNumber, `Hi, I'd like to know more about ${name}.`)
    : undefined;

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name, url });
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div
      className="animate-fadeUp glass fixed inset-x-3 z-chrome flex items-center gap-1 rounded-[1.75rem] px-2 py-2 shadow-premium lg:hidden"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <FavoriteButton
        listingType={listingType}
        listingId={listingId}
        initiallyFavorited={initiallyFavorited}
        locale={locale}
        size={18}
        showSpinner={false}
        className={`${ICON_BUTTON_CLASS} disabled:opacity-60`}
        addLabel={t("save")}
        removeLabel={t("save")}
      />

      {phone && (
        <a href={`tel:${phone}`} aria-label={`${t("call")} — ${name}`} className={ICON_BUTTON_CLASS}>
          <Phone size={18} aria-hidden="true" />
        </a>
      )}

      {directionsHref && (
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t("directions")} — ${name}`}
          className={ICON_BUTTON_CLASS}
        >
          <Navigation size={17} aria-hidden="true" />
        </a>
      )}

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t("whatsapp")} — ${name}`}
          className={`${ICON_BUTTON_CLASS} hover:!text-[#25D366]`}
        >
          <MessageCircle size={18} aria-hidden="true" />
        </a>
      )}

      <button type="button" onClick={onShare} aria-label={t("share")} className={ICON_BUTTON_CLASS}>
        {copied ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
      </button>

      <div className="min-w-0 flex-1" />

      {showPrimary && bookingCta && (
        <HotelBookNowButton
          cta={bookingCta}
          locale={locale}
          hotelId={listingId}
          hotelName={name}
          rooms={rooms}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-7 text-sm font-bold text-white shadow-soft transition-all duration-150 hover:bg-primary-700 active:scale-95"
        />
      )}

      {showPrimary && !bookingCta && reservable && (
        <TableReservationButton
          listingType={listingType as "restaurant" | "cafe"}
          listingId={listingId}
          businessName={name}
          locale={locale}
          label={primaryLabel ?? t("bookNow")}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-7 text-sm font-bold text-white shadow-soft transition-all duration-150 hover:bg-primary-700 active:scale-95"
        />
      )}

      {showPrimary &&
        !bookingCta &&
        !reservable &&
        (booking ? (
          <a
            href={booking.href}
            target={booking.external ? "_blank" : undefined}
            rel={booking.external ? "noopener noreferrer" : undefined}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-7 text-sm font-bold text-white transition-all duration-150 hover:bg-primary-700 active:scale-95"
          >
            {primaryLabel ?? t("bookNow")}
            {booking.external && <ArrowUpRight size={15} aria-hidden="true" />}
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex h-12 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-primary/40 px-7 text-sm font-bold text-white/80"
          >
            {primaryLabel ?? t("bookNow")}
          </button>
        ))}
    </div>
  );
}
