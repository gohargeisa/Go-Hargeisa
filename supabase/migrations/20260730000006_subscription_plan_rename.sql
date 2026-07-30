-- ============================================================================
-- Go Hargeisa — Phase 4 Stage 1: Subscription plan rename
-- Renames the Phase 2 three-tier scheme (Basic $9.99 / Gold $29.99 /
-- Platinum $39.99) to the Phase 4 scheme (Basic / Silver / Gold). Postgres
-- enum renames are in-place — every business_subscriptions row keeps its
-- existing assignment, just under the new name. Order matters: 'gold' must
-- be renamed to 'silver' first to free up 'gold' before 'platinum' claims
-- it. Prices are app-layer only (lib/config/subscription-plans.ts), not
-- stored in the database, so there's nothing to migrate there.
-- Safe to re-run except the two `rename value` lines, which will error
-- "does not exist" once already applied — expected, matches the pattern
-- established in 20260730000001_subscription_tiers.sql.
-- ============================================================================

alter type subscription_tier rename value 'gold' to 'silver';
alter type subscription_tier rename value 'platinum' to 'gold';
