import type { Locale } from "@/lib/i18n/config";
import type {
  LoyaltyProgram,
  LoyaltyTier,
  LoyaltyReward,
  LoyaltyOffer,
  LoyaltyTierBenefit,
} from "./types";

/** Same locale-resolution shape as productLocalizedName — English primary,
 * `_ar` / `_so` overrides when present for that locale. */
function pick(locale: string, primary: string, ar: string | null, so: string | null): string {
  return (locale === "ar" && ar) || (locale === "so" && so) || primary;
}
function pickOpt(
  locale: string,
  primary: string | null,
  ar: string | null,
  so: string | null
): string | null {
  return (locale === "ar" && ar) || (locale === "so" && so) || primary;
}

export const programName = (p: LoyaltyProgram, l: string) => pick(l, p.name, p.nameAr, p.nameSo);
export const programDescription = (p: LoyaltyProgram, l: string) =>
  pickOpt(l, p.description, p.descriptionAr, p.descriptionSo);

export const tierName = (t: LoyaltyTier, l: string) => pick(l, t.name, t.nameAr, t.nameSo);

export const rewardName = (r: LoyaltyReward, l: string) => pick(l, r.name, r.nameAr, r.nameSo);
export const rewardDescription = (r: LoyaltyReward, l: string) =>
  pickOpt(l, r.description, r.descriptionAr, r.descriptionSo);
export const rewardFreeProduct = (r: LoyaltyReward, l: string) =>
  pickOpt(l, r.freeProductText, r.freeProductAr, r.freeProductSo);
export const rewardTerms = (r: LoyaltyReward, l: string) =>
  pickOpt(l, r.terms, r.termsAr, r.termsSo);

export const offerTitle = (o: LoyaltyOffer, l: string) => pick(l, o.title, o.titleAr, o.titleSo);
export const offerDescription = (o: LoyaltyOffer, l: string) =>
  pickOpt(l, o.description, o.descriptionAr, o.descriptionSo);
export const offerBadge = (o: LoyaltyOffer, l: string) =>
  pickOpt(l, o.badgeText, o.badgeTextAr, o.badgeTextSo);

export function benefitText(b: LoyaltyTierBenefit, l: string): string {
  return (l === "ar" && b.ar) || (l === "so" && b.so) || b.en;
}

/**
 * Given the ordered tier list and the member's LIFETIME points, resolve the
 * current tier, the next tier (if any), and how many points remain to reach
 * it. Mirrors loyalty_recalc_tier(): current tier = highest tier whose
 * minPoints has been reached.
 */
export function resolveTierProgress(
  tiers: LoyaltyTier[],
  lifetimePoints: number
): { current: LoyaltyTier | null; next: LoyaltyTier | null; pointsToNext: number | null } {
  const ordered = [...tiers]
    .filter((t) => t.active)
    .sort((a, b) => a.minPoints - b.minPoints);
  if (ordered.length === 0) return { current: null, next: null, pointsToNext: null };

  let current: LoyaltyTier | null = null;
  for (const t of ordered) {
    if (lifetimePoints >= t.minPoints) current = t;
    else break;
  }
  const currentIndex = current ? ordered.findIndex((t) => t.id === current!.id) : -1;
  const next = currentIndex >= 0 && currentIndex < ordered.length - 1 ? ordered[currentIndex + 1] : null;
  const pointsToNext = next ? Math.max(0, next.minPoints - lifetimePoints) : null;
  return { current, next, pointsToNext };
}

/** Whether a reward is redeemable *right now* by this member — mirrors every
 * gate loyalty_redeem_reward() enforces so the UI never offers something the
 * RPC will refuse. `usedByMe` / `usedTotal` come from the member's redemptions
 * + (optionally) a program-wide count. */
export function rewardAvailability(params: {
  reward: LoyaltyReward;
  currentPoints: number;
  memberTier: LoyaltyTier | null;
  tiersById: Map<string, LoyaltyTier>;
  usedByMe: number;
  usedTotal?: number;
}): { redeemable: boolean; reason: null | "points" | "tier" | "limit" | "inactive" | "window" } {
  const { reward, currentPoints, memberTier, tiersById, usedByMe, usedTotal } = params;
  const today = new Date().toISOString().slice(0, 10);

  if (!reward.active) return { redeemable: false, reason: "inactive" };
  if (reward.startDate && today < reward.startDate) return { redeemable: false, reason: "window" };
  if (reward.endDate && today > reward.endDate) return { redeemable: false, reason: "window" };
  if (usedByMe >= reward.perMemberLimit) return { redeemable: false, reason: "limit" };
  if (reward.redemptionLimit !== null && usedTotal !== undefined && usedTotal >= reward.redemptionLimit)
    return { redeemable: false, reason: "limit" };
  if (reward.minTierId) {
    const requiredTier = tiersById.get(reward.minTierId);
    const haveMin = memberTier && requiredTier ? memberTier.minPoints >= requiredTier.minPoints : false;
    if (!haveMin) return { redeemable: false, reason: "tier" };
  }
  if (currentPoints < reward.pointsRequired) return { redeemable: false, reason: "points" };
  return { redeemable: true, reason: null };
}

/** Human-facing reward value label, localised numerics left to the caller's
 * Intl formatting. */
export function rewardValueLabel(
  reward: LoyaltyReward,
  locale: Locale,
  currency: string,
  freeProductFallback: string
): string {
  if (reward.rewardType === "discount_percent" && reward.discountValue != null) {
    return `${reward.discountValue}%`;
  }
  if (reward.rewardType === "discount_amount" && reward.discountValue != null) {
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency }).format(reward.discountValue);
    } catch {
      return `${currency} ${reward.discountValue}`;
    }
  }
  return rewardFreeProduct(reward, locale) ?? freeProductFallback;
}
