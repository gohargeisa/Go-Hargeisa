import { normalizeExternalUrl } from "@/lib/utils/normalize-url";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import type { HotelBookingMode, HotelExternalBookingOption } from "@/types";

export type HotelBookingCta =
  | { kind: "go_hargeisa"; label: string }
  | { kind: "external"; href: string; label: string };

export interface BookingCtaLabels {
  bookNow: string;
  bookOnWebsite: string;
  bookViaWhatsApp: string;
  bookOnBookingCom: string;
}

export interface BookableHotel {
  name: string;
  bookingMode?: HotelBookingMode;
  externalBookingOption?: HotelExternalBookingOption;
  externalBookingUrl?: string;
  bookingWhatsapp?: string;
  bookingComUrl?: string;
  website?: string;
  phone?: string;
}

/**
 * Single source of truth for what a hotel's "Book Now" button should do —
 * every booking surface (top action bar, sidebar card, mobile sticky bar,
 * per-room cards) calls this instead of re-deriving the logic, so a hotel's
 * configured mode behaves identically everywhere it appears. Column-driven:
 * no hotel-specific branching, works the same for 1 hotel or 10,000.
 *
 * External mode falls back to whichever external field is actually filled
 * in if the chosen `externalBookingOption` itself has no value (e.g. the
 * owner picked "WhatsApp" but hasn't saved a number yet) — and falls all the
 * way back to Go Hargeisa's own request flow if external mode has nothing
 * usable configured at all, so guests are never left with a dead button.
 */
export function getHotelBookingCta(hotel: BookableHotel, labels: BookingCtaLabels): HotelBookingCta {
  const goHargeisa: HotelBookingCta = { kind: "go_hargeisa", label: labels.bookNow };

  if ((hotel.bookingMode ?? "go_hargeisa") !== "external") return goHargeisa;

  const whatsappNumber = hotel.bookingWhatsapp || hotel.phone;
  const candidates: Record<HotelExternalBookingOption, HotelBookingCta | null> = {
    website: hotel.website
      ? { kind: "external", href: normalizeExternalUrl(hotel.website), label: labels.bookOnWebsite }
      : null,
    booking_com: hotel.bookingComUrl
      ? { kind: "external", href: normalizeExternalUrl(hotel.bookingComUrl), label: labels.bookOnBookingCom }
      : null,
    whatsapp: whatsappNumber
      ? {
          kind: "external",
          href: toWhatsAppHref(whatsappNumber, `Hi, I'd like to book a room at ${hotel.name}.`),
          label: labels.bookViaWhatsApp,
        }
      : null,
    custom_url: hotel.externalBookingUrl
      ? { kind: "external", href: normalizeExternalUrl(hotel.externalBookingUrl), label: labels.bookNow }
      : null,
  };

  const chosen = hotel.externalBookingOption ? candidates[hotel.externalBookingOption] : null;
  if (chosen) return chosen;

  // Chosen option has no value saved yet — fall back to any other external
  // field that does, then to Go Hargeisa's own booking flow as a last resort.
  return candidates.website ?? candidates.booking_com ?? candidates.whatsapp ?? candidates.custom_url ?? goHargeisa;
}
