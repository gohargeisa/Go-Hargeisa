/**
 * The three subscription tiers, Phase 4 Stage 1 (renamed from Phase 2's
 * Basic/Gold/Platinum — see supabase/migrations/20260730000004_subscription_
 * plan_rename.sql). Deliberately just data — there is no payment gateway in
 * this phase (Stripe/Zaad/eDahab are explicitly out of scope). The owner
 * assigns a business's plan manually from /admin/partners;
 * lib/data/business.ts's getOrCreateSubscription still lazily creates a
 * 'basic' row for a business on their first dashboard visit, same as it
 * always has.
 */
export type SubscriptionPlanId = "basic" | "silver" | "gold";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceUsd: number;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  basic: { id: "basic", name: "Basic", priceUsd: 9 },
  silver: { id: "silver", name: "Silver", priceUsd: 29 },
  gold: { id: "gold", name: "Gold", priceUsd: 39 },
};

export const SUBSCRIPTION_PLAN_ORDER: SubscriptionPlanId[] = ["basic", "silver", "gold"];
