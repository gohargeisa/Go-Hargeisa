import type { OfferLifecycleStatus } from "@/types";

/**
 * Derives an offer's lifecycle status from its dates + the owner's on/off
 * toggle, computed fresh on every read instead of stored — this is how
 * "auto-expire" works with no cron job: the moment `endsAt` is in the past,
 * every caller sees "expired" immediately.
 */
export function getOfferLifecycleStatus(offer: {
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
}): OfferLifecycleStatus {
  if (!offer.isActive) return "inactive";

  const now = new Date();
  if (offer.startsAt) {
    const starts = new Date(`${offer.startsAt}T00:00:00`);
    if (starts > now) return "scheduled";
  }
  if (offer.endsAt) {
    const ends = new Date(`${offer.endsAt}T23:59:59`);
    if (ends < now) return "expired";
  }
  return "active";
}

/** Whether the offer should actually be shown to visitors right now —
 * approved by an admin, toggled on by the owner, and within its date
 * window. Used by every public surface (homepage, listing pages). */
export function isOfferLive(offer: {
  isActive: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  startsAt?: string;
  endsAt?: string;
}): boolean {
  return offer.approvalStatus === "approved" && getOfferLifecycleStatus(offer) === "active";
}

export function formatOfferDiscount(offer: { discountType: "percentage" | "fixed"; discountValue?: number }): string | null {
  if (offer.discountValue === undefined || offer.discountValue === null) return null;
  return offer.discountType === "percentage" ? `${offer.discountValue}% OFF` : `$${offer.discountValue} OFF`;
}
