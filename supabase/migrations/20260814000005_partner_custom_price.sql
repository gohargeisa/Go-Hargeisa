-- ============================================================================
-- Go Hargeisa — Manual/custom partner subscription pricing
--
-- Tier prices (Basic $9 / Silver $29 / Gold $39) have always been app-layer
-- only (lib/config/subscription-plans.ts), never stored in the database —
-- see the comment in 20260730000006_subscription_plan_rename.sql. This adds
-- one nullable numeric column so the platform owner can override the price
-- for an individual partner (e.g. a negotiated rate) without touching code.
--
-- null (the default, and every existing row's current state) means "use
-- the plan tier's standard price" — unchanged behavior for every partner
-- until an admin explicitly sets a value via the new setCustomPrice action.
-- No RLS change needed: this column inherits the existing "Owners manage
-- all subscriptions" UPDATE policy (business_owners already have no UPDATE
-- policy on this table at all, only SELECT/INSERT-once — see
-- 20260730000001_subscription_tiers.sql).
-- ============================================================================

alter table business_subscriptions add column if not exists custom_price_usd numeric(10, 2);
