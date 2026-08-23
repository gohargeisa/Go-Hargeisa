-- ============================================================================
-- Go Hargeisa — add 'premium' to the subscription_tier enum
--
-- Introduces the $59.99/month "Premium Partner" plan as a NEW, ADDITIVE
-- tier alongside the existing basic/silver/gold scheme (see
-- lib/config/subscription-plans.ts) — it does not replace, rename, or
-- reassign any existing plan. No partner is migrated onto it by this
-- migration; every current business_subscriptions row keeps its existing
-- plan_tier exactly as-is. An admin opts a partner into 'premium' later,
-- the same way any other plan change already works, via the existing
-- assignSubscriptionPlan action / admin Partners UI — no new mechanism.
--
-- SAFETY: `ALTER TYPE ... ADD VALUE` only ever appends a new label to the
-- enum. It cannot rename, remove, or reorder any existing value, and
-- cannot affect any existing row (no row currently has or can have
-- 'premium' before this migration exists). `IF NOT EXISTS` makes this
-- safe to re-run.
-- ============================================================================

alter type subscription_tier add value if not exists 'premium';
