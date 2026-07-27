import { normalizeExternalUrl } from "@/lib/utils/normalize-url";

/**
 * Same website→external / phone→tel fallback HotelBookingCard has always
 * used, factored out so the new Rooms section (and anything else that needs
 * a "Book Now" CTA) doesn't duplicate the logic.
 */
export function getBookingHref(opts: { website?: string; phone?: string }): { href: string; external: boolean } | null {
  if (opts.website) return { href: normalizeExternalUrl(opts.website), external: true };
  if (opts.phone) return { href: `tel:${opts.phone}`, external: false };
  return null;
}
