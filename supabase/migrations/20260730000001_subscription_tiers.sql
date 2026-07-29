-- ============================================================================
-- Go Hargeisa — Phase 2: Subscription tiers (Basic / Gold / Platinum)
-- Replaces the old two-tier standard/premium subscription_tier enum with
-- three named, priced tiers. Existing rows keep their data — Postgres lets
-- an enum value be renamed in place, so every row currently 'standard'
-- becomes 'basic' and every row currently 'premium' becomes 'platinum'
-- without a data migration. 'gold' is a new middle tier.
--
-- Also tightens business_subscriptions RLS: per product decision, plan
-- assignment is manual and owner-only (no payment gateway in this phase).
-- The previous "Business owners manage their own subscription" policy was
-- `for all`, which let a business_owner UPDATE their own plan_tier directly
-- — replaced with SELECT (view their plan) + INSERT (lets the existing
-- lazy-create-on-first-dashboard-visit flow in lib/data/business.ts's
-- getOrCreateSubscription keep working) only. Changing an EXISTING row's
-- plan_tier now requires the owner role.
-- Safe to re-run except the two `alter type ... rename value` lines, which
-- are already idempotent in effect (re-running after the rename has
-- happened will simply error "does not exist" for the old name — expected).
-- ============================================================================

alter type subscription_tier rename value 'standard' to 'basic';
alter type subscription_tier rename value 'premium' to 'platinum';
alter type subscription_tier add value if not exists 'gold';

drop policy if exists "Business owners manage their own subscription" on business_subscriptions;

create policy "Business owners view their own subscription" on business_subscriptions
  for select
  using (
    (listing_type = 'hotel' and exists (select 1 from hotels h where h.id = listing_id and h.owner_id = auth.uid()))
    or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = listing_id and r.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = listing_id and c.owner_id = auth.uid()))
    or (listing_type = 'service' and exists (select 1 from services s where s.id = listing_id and s.owner_id = auth.uid()))
  );

create policy "Business owners create their own subscription once" on business_subscriptions
  for insert
  with check (
    (listing_type = 'hotel' and exists (select 1 from hotels h where h.id = listing_id and h.owner_id = auth.uid()))
    or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = listing_id and r.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = listing_id and c.owner_id = auth.uid()))
    or (listing_type = 'service' and exists (select 1 from services s where s.id = listing_id and s.owner_id = auth.uid()))
  );
