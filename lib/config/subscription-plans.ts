/**
 * The three subscription tiers, Phase 2. Deliberately just data — there is
 * no payment gateway in this phase (Stripe/Zaad/eDahab are explicitly out
 * of scope). The owner assigns a business's plan manually from
 * /admin/partners; lib/data/business.ts's getOrCreateSubscription still
 * lazily creates a 'basic' row for a business on their first dashboard
 * visit, same as it always has.
 */
export type SubscriptionPlanId = "basic" | "gold" | "platinum";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceUsd: number;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  basic: { id: "basic", name: "Basic", priceUsd: 9.99 },
  gold: { id: "gold", name: "Gold", priceUsd: 29.99 },
  platinum: { id: "platinum", name: "Platinum", priceUsd: 39.99 },
};

export const SUBSCRIPTION_PLAN_ORDER: SubscriptionPlanId[] = ["basic", "gold", "platinum"];
