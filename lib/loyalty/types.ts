/**
 * Go Hargeisa — Digital Loyalty / Rewards: app-facing types.
 *
 * The loyalty tables (see supabase/migrations/20260908000001_loyalty_core.sql)
 * are intentionally NOT in types/database.ts — that file is only consulted by
 * code that references `Database["public"]["Tables"][...]`, and the Supabase
 * clients in this project are not generic over `Database`, so `.from(...)` /
 * `.rpc(...)` for loyalty are loosely typed at the call site and mapped to the
 * domain types below in lib/loyalty/mappers.ts. If the schema types are ever
 * regenerated from a linked project, the loyalty tables appear there
 * automatically and nothing here needs to change.
 *
 * REUSABLE BY DESIGN: nothing in this module is Flormar-specific. A program is
 * addressed by the platform's existing polymorphic identity
 * (listing_type, listing_id); Flormar is simply the one program with
 * `enabled = true` right now.
 */

export type LoyaltyListingType = "hotel" | "restaurant" | "cafe" | "service" | "city_service";

export type LoyaltyMemberStatus = "active" | "suspended" | "closed";

export type LoyaltyTransactionType =
  | "PURCHASE_EARN"
  | "WELCOME_BONUS"
  | "BONUS"
  | "REDEMPTION"
  | "MANUAL_ADJUSTMENT"
  | "REFUND"
  | "EXPIRATION";

export type LoyaltyRewardType =
  | "discount_amount"
  | "discount_percent"
  | "free_product"
  | "gift"
  | "other";

export type LoyaltyRedemptionStatus = "issued" | "redeemed" | "expired" | "cancelled";

/** One localised benefit line on a tier (`loyalty_tiers.benefits` jsonb). */
export interface LoyaltyTierBenefit {
  en: string;
  ar?: string;
  so?: string;
}

export interface LoyaltyProgram {
  id: string;
  listingType: LoyaltyListingType;
  listingId: string;
  name: string;
  nameAr: string | null;
  nameSo: string | null;
  description: string | null;
  descriptionAr: string | null;
  descriptionSo: string | null;
  enabled: boolean;
  pointsPerCurrency: number;
  currency: string;
  expirationEnabled: boolean;
  expirationMonths: number;
  welcomeBonusPoints: number;
  redemptionTtlDays: number;
}

export interface LoyaltyTier {
  id: string;
  programId: string;
  key: string;
  name: string;
  nameAr: string | null;
  nameSo: string | null;
  minPoints: number;
  maxPoints: number | null;
  benefits: LoyaltyTierBenefit[];
  multiplier: number;
  color: string | null;
  sortOrder: number;
  active: boolean;
}

export interface LoyaltyMember {
  id: string;
  programId: string;
  userId: string;
  membershipNumber: string;
  /** Opaque QR identifier — never a user id / phone / email. */
  memberUid: string;
  currentPoints: number;
  lifetimePoints: number;
  tierId: string | null;
  status: LoyaltyMemberStatus;
  joinedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  programId: string;
  memberId: string;
  type: LoyaltyTransactionType;
  points: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

export interface LoyaltyReward {
  id: string;
  programId: string;
  name: string;
  nameAr: string | null;
  nameSo: string | null;
  description: string | null;
  descriptionAr: string | null;
  descriptionSo: string | null;
  imageUrl: string | null;
  rewardType: LoyaltyRewardType;
  pointsRequired: number;
  discountValue: number | null;
  freeProductText: string | null;
  freeProductAr: string | null;
  freeProductSo: string | null;
  terms: string | null;
  termsAr: string | null;
  termsSo: string | null;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  redemptionLimit: number | null;
  perMemberLimit: number;
  minTierId: string | null;
  sortOrder: number;
}

export interface LoyaltyOffer {
  id: string;
  programId: string;
  title: string;
  titleAr: string | null;
  titleSo: string | null;
  description: string | null;
  descriptionAr: string | null;
  descriptionSo: string | null;
  imageUrl: string | null;
  badgeText: string | null;
  badgeTextAr: string | null;
  badgeTextSo: string | null;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
}

/** Frozen copy of a reward at redemption time (`reward_snapshot` jsonb). */
export interface LoyaltyRewardSnapshot {
  name: string;
  name_ar: string | null;
  name_so: string | null;
  reward_type: LoyaltyRewardType;
  discount_value: number | null;
  free_product_text: string | null;
  points_required: number;
  image_url: string | null;
}

export interface LoyaltyRedemption {
  id: string;
  programId: string;
  rewardId: string;
  memberId: string;
  redemptionCode: string;
  pointsSpent: number;
  rewardSnapshot: LoyaltyRewardSnapshot | null;
  status: LoyaltyRedemptionStatus;
  issuedAt: string;
  expiresAt: string | null;
  redeemedAt: string | null;
}

/**
 * Everything the customer Rewards experience needs for one program, resolved
 * from a listing slug. `member` / `transactions` / `redemptions` are null/empty
 * for a visitor who hasn't joined (or isn't signed in).
 */
export interface LoyaltyContext {
  program: LoyaltyProgram;
  /** Display identity of the underlying partner listing. */
  listing: {
    slug: string;
    name: string;
    logoUrl: string | null;
  };
  tiers: LoyaltyTier[];
  rewards: LoyaltyReward[];
  offers: LoyaltyOffer[];
  member: LoyaltyMember | null;
  currentTier: LoyaltyTier | null;
  nextTier: LoyaltyTier | null;
  transactions: LoyaltyTransaction[];
  hasMoreTransactions: boolean;
  redemptions: LoyaltyRedemption[];
}

// ---------------------------------------------------------------------------
// Staff console (Phase 8) — shapes returned by the staff RPCs.
// ---------------------------------------------------------------------------

export type LoyaltyStaffRole = "staff" | "manager" | "owner";

/** The counter view for one member — `loyalty_staff_lookup()` /
 * `loyalty_staff_lookup_by_number()` return exactly this jsonb shape. */
export interface StaffMemberDoc {
  member: {
    id: string;
    member_uid: string;
    membership_number: string;
    name: string | null;
    current_points: number;
    lifetime_points: number;
    status: LoyaltyMemberStatus;
    joined_at: string;
    tier: {
      key: string;
      name: string;
      name_ar: string | null;
      name_so: string | null;
      multiplier: number;
      color: string | null;
    } | null;
  };
  program: {
    id: string;
    name: string;
    currency: string;
    points_per_currency: number;
  };
  recent_transactions: {
    id: string;
    type: LoyaltyTransactionType;
    points: number;
    balance_after: number;
    description: string | null;
    created_at: string;
  }[];
  open_redemptions: {
    id: string;
    code: string;
    status: LoyaltyRedemptionStatus;
    snapshot: LoyaltyRewardSnapshot | null;
    points_spent: number;
    issued_at: string;
    expires_at: string | null;
  }[];
  available_rewards: {
    id: string;
    name: string;
    name_ar: string | null;
    name_so: string | null;
    points_required: number;
    reward_type: LoyaltyRewardType;
    discount_value: number | null;
    free_product_text: string | null;
  }[];
}
