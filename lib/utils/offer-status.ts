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

/**
 * Before→after pricing for an offer that carries both an `originalPrice` and
 * a `salePrice` (e.g. Al-Hikma's $35 → $25). Returns null unless both are
 * present, valid, and the sale is a genuine reduction — so a caller can
 * render this block unconditionally and fall back to `formatOfferDiscount`
 * / plain pricing otherwise. `save` and `pct` are always derived here, never
 * stored, so they can't drift from the two prices.
 */
export function formatOfferPricing(offer: { originalPrice?: number; salePrice?: number }): {
  original: number;
  sale: number;
  save: number;
  pct: number;
} | null {
  const { originalPrice: o, salePrice: s } = offer;
  if (o === undefined || s === undefined || o === null || s === null) return null;
  if (!Number.isFinite(o) || !Number.isFinite(s)) return null;
  if (o <= 0 || s < 0 || s >= o) return null;
  const save = Math.round((o - s) * 100) / 100;
  const pct = Math.round(((o - s) / o) * 100);
  return { original: o, sale: s, save, pct };
}
