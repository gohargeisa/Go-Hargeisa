/**
 * The subscription tiers, Phase 4 Stage 1 (basic/silver/gold renamed from
 * Phase 2's Basic/Gold/Platinum — see supabase/migrations/20260730000004_
 * subscription_plan_rename.sql) plus 'premium', the paid "Go Hargeisa
 * Premium" plan added in supabase/migrations/20260904000001_subscription_
 * premium_partner_tier.sql. Deliberately just data — there is no payment
 * gateway in this phase (Stripe/Zaad/eDahab are explicitly out of scope),
 * including for 'premium': it's recorded the same manual way as every
 * other plan. The owner assigns a business's plan manually from
 * /admin/partners; lib/data/business.ts's getOrCreateSubscription still
 * lazily creates a 'basic' row for a business on their first dashboard
 * visit, same as it always has — adding 'premium' doesn't change that
 * default, or reassign any existing partner's current plan.
 */
export type SubscriptionPlanId = "basic" | "silver" | "gold" | "premium";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceUsd: number;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  basic: { id: "basic", name: "Basic", priceUsd: 9 },
  silver: { id: "silver", name: "Silver", priceUsd: 29 },
  gold: { id: "gold", name: "Gold", priceUsd: 39 },
  premium: { id: "premium", name: "Premium Partner", priceUsd: 59.99 },
};

export const SUBSCRIPTION_PLAN_ORDER: SubscriptionPlanId[] = ["basic", "silver", "gold", "premium"];
