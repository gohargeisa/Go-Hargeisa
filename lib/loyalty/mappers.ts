import type {
  LoyaltyProgram,
  LoyaltyTier,
  LoyaltyMember,
  LoyaltyTransaction,
  LoyaltyReward,
  LoyaltyOffer,
  LoyaltyRedemption,
  LoyaltyTierBenefit,
  LoyaltyRewardSnapshot,
  LoyaltyListingType,
  LoyaltyMemberStatus,
  LoyaltyTransactionType,
  LoyaltyRewardType,
  LoyaltyRedemptionStatus,
} from "./types";

/**
 * Row → domain mappers for the loyalty tables. Rows come from the project's
 * non-generic Supabase client (`.from("loyalty_*")`), so they're loosely
 * typed here; each mapper reads only the columns defined in
 * 20260908000001_loyalty_core.sql.
 */
type Row = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" ? v : String(v ?? ""));
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);
const num = (v: unknown): number => (typeof v === "number" ? v : Number(v ?? 0));
const numOrNull = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v);
const bool = (v: unknown): boolean => v === true;

function benefits(v: unknown): LoyaltyTierBenefit[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((b): b is Record<string, unknown> => !!b && typeof b === "object")
    .map((b) => ({
      en: str(b.en),
      ar: strOrNull(b.ar) ?? undefined,
      so: strOrNull(b.so) ?? undefined,
    }))
    .filter((b) => b.en.length > 0);
}

export function mapLoyaltyProgram(r: Row): LoyaltyProgram {
  return {
    id: str(r.id),
    listingType: str(r.listing_type) as LoyaltyListingType,
    listingId: str(r.listing_id),
    name: str(r.name),
    nameAr: strOrNull(r.name_ar),
    nameSo: strOrNull(r.name_so),
    description: strOrNull(r.description),
    descriptionAr: strOrNull(r.description_ar),
    descriptionSo: strOrNull(r.description_so),
    enabled: bool(r.enabled),
    pointsPerCurrency: num(r.points_per_currency),
    currency: str(r.currency) || "USD",
    expirationEnabled: bool(r.expiration_enabled),
    expirationMonths: num(r.expiration_months),
    welcomeBonusPoints: num(r.welcome_bonus_points),
    redemptionTtlDays: num(r.redemption_ttl_days),
  };
}

export function mapLoyaltyTier(r: Row): LoyaltyTier {
  return {
    id: str(r.id),
    programId: str(r.program_id),
    key: str(r.key),
    name: str(r.name),
    nameAr: strOrNull(r.name_ar),
    nameSo: strOrNull(r.name_so),
    minPoints: num(r.min_points),
    maxPoints: numOrNull(r.max_points),
    benefits: benefits(r.benefits),
    multiplier: num(r.multiplier),
    color: strOrNull(r.color),
    sortOrder: num(r.sort_order),
    active: bool(r.active),
  };
}

export function mapLoyaltyMember(r: Row): LoyaltyMember {
  return {
    id: str(r.id),
    programId: str(r.program_id),
    userId: str(r.user_id),
    membershipNumber: str(r.membership_number),
    memberUid: str(r.member_uid),
    currentPoints: num(r.current_points),
    lifetimePoints: num(r.lifetime_points),
    tierId: strOrNull(r.tier_id),
    status: str(r.status) as LoyaltyMemberStatus,
    joinedAt: str(r.joined_at),
  };
}

export function mapLoyaltyTransaction(r: Row): LoyaltyTransaction {
  return {
    id: str(r.id),
    programId: str(r.program_id),
    memberId: str(r.member_id),
    type: str(r.type) as LoyaltyTransactionType,
    points: num(r.points),
    balanceAfter: num(r.balance_after),
    referenceType: strOrNull(r.reference_type),
    referenceId: strOrNull(r.reference_id),
    description: strOrNull(r.description),
    createdAt: str(r.created_at),
  };
}

export function mapLoyaltyReward(r: Row): LoyaltyReward {
  return {
    id: str(r.id),
    programId: str(r.program_id),
    name: str(r.name),
    nameAr: strOrNull(r.name_ar),
    nameSo: strOrNull(r.name_so),
    description: strOrNull(r.description),
    descriptionAr: strOrNull(r.description_ar),
    descriptionSo: strOrNull(r.description_so),
    imageUrl: strOrNull(r.image_url),
    rewardType: str(r.reward_type) as LoyaltyRewardType,
    pointsRequired: num(r.points_required),
    discountValue: numOrNull(r.discount_value),
    freeProductText: strOrNull(r.free_product_text),
    freeProductAr: strOrNull(r.free_product_ar),
    freeProductSo: strOrNull(r.free_product_so),
    terms: strOrNull(r.terms),
    termsAr: strOrNull(r.terms_ar),
    termsSo: strOrNull(r.terms_so),
    active: bool(r.active),
    startDate: strOrNull(r.start_date),
    endDate: strOrNull(r.end_date),
    redemptionLimit: numOrNull(r.redemption_limit),
    perMemberLimit: num(r.per_member_limit) || 1,
    minTierId: strOrNull(r.min_tier_id),
    sortOrder: num(r.sort_order),
  };
}

export function mapLoyaltyOffer(r: Row): LoyaltyOffer {
  return {
    id: str(r.id),
    programId: str(r.program_id),
    title: str(r.title),
    titleAr: strOrNull(r.title_ar),
    titleSo: strOrNull(r.title_so),
    description: strOrNull(r.description),
    descriptionAr: strOrNull(r.description_ar),
    descriptionSo: strOrNull(r.description_so),
    imageUrl: strOrNull(r.image_url),
    badgeText: strOrNull(r.badge_text),
    badgeTextAr: strOrNull(r.badge_text_ar),
    badgeTextSo: strOrNull(r.badge_text_so),
    active: bool(r.active),
    startDate: strOrNull(r.start_date),
    endDate: strOrNull(r.end_date),
    sortOrder: num(r.sort_order),
  };
}

function rewardSnapshot(v: unknown): LoyaltyRewardSnapshot | null {
  if (!v || typeof v !== "object") return null;
  const s = v as Record<string, unknown>;
  if (!s.name) return null;
  return {
    name: str(s.name),
    name_ar: strOrNull(s.name_ar),
    name_so: strOrNull(s.name_so),
    reward_type: str(s.reward_type) as LoyaltyRewardType,
    discount_value: numOrNull(s.discount_value),
    free_product_text: strOrNull(s.free_product_text),
    points_required: num(s.points_required),
    image_url: strOrNull(s.image_url),
  };
}

export function mapLoyaltyRedemption(r: Row): LoyaltyRedemption {
  return {
    id: str(r.id),
    programId: str(r.program_id),
    rewardId: str(r.reward_id),
    memberId: str(r.member_id),
    redemptionCode: str(r.redemption_code),
    pointsSpent: num(r.points_spent),
    rewardSnapshot: rewardSnapshot(r.reward_snapshot),
    status: str(r.status) as LoyaltyRedemptionStatus,
    issuedAt: str(r.issued_at),
    expiresAt: strOrNull(r.expires_at),
    redeemedAt: strOrNull(r.redeemed_at),
  };
}
