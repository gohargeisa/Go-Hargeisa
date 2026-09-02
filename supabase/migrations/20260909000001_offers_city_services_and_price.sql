-- ============================================================================
-- Go Hargeisa — Offers: extend to City Services + before/after pricing
--
-- Two additive, backward-compatible changes to the existing business_offers
-- system (20260801000002 + 20260801000004 + 20260802000003):
--
--  1. New OPTIONAL columns `original_price` / `sale_price`. When both are
--     set, the public offer card renders a "was $X → now $Y, SAVE $Z, N% OFF"
--     block (see lib/utils/offer-status.ts `formatOfferPricing`). The
--     existing `discount_type` / `discount_value` model is untouched and
--     still works exactly as before — an offer can use either, both, or
--     neither.
--
--  2. `listing_type = 'city_service'` is now a valid offer scope, so a
--     clinic / salon / gym / shop partner (all `city_services` rows) can run
--     an offer the same way a hotel/restaurant/cafe already can. This just
--     adds a fourth branch — mirroring the existing three exactly — to the
--     public-read and owner-manage RLS policies. `city_services` already has
--     `owner_id` (20260809000001) and `status` (content_status, default
--     'published'), so the branch is identical in shape to the cafe one.
--
-- No column is dropped, no row is modified, no enum is altered. Safe to
-- re-run.
-- ============================================================================

alter table business_offers add column if not exists original_price numeric;
alter table business_offers add column if not exists sale_price numeric;

-- Non-negative, and a sale price can never exceed the "was" price. Only
-- enforced when the relevant value(s) are present — an offer using the
-- percentage/fixed model leaves both null and is unaffected.
alter table business_offers drop constraint if exists business_offers_price_sane;
alter table business_offers add constraint business_offers_price_sane check (
  (original_price is null or original_price >= 0)
  and (sale_price is null or sale_price >= 0)
  and (sale_price is null or original_price is null or sale_price <= original_price)
);

-- ----------------------------------------------------------------------------
-- Public read — approved + active + within date window + published listing.
-- Adds the city_service branch; the hotel/restaurant/cafe branches are
-- byte-for-byte the ones already live (20260802000003).
-- ----------------------------------------------------------------------------
drop policy if exists "Public reads active offers for published listings" on business_offers;
drop policy if exists "Public reads approved offers for published listings" on business_offers;
create policy "Public reads approved offers for published listings" on business_offers for select
  using (
    is_active = true
    and approval_status = 'approved'
    and (
      (listing_type = 'hotel' and exists (select 1 from hotels h where h.id = listing_id and h.status = 'published'))
      or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = listing_id and r.status = 'published'))
      or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = listing_id and c.status = 'published'))
      or (listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = listing_id and cs.status = 'published'))
    )
  );

-- ----------------------------------------------------------------------------
-- Business owner manage-own — adds the city_service owner_id branch;
-- hotel/restaurant/cafe branches unchanged from 20260801000002.
-- ("Owners manage all offers" (platform admin, role-based) and "Team members
--  manage offers per grant" (has_business_permission on listing_type::text)
--  already cover city_service without change and are left alone.)
-- ----------------------------------------------------------------------------
drop policy if exists "Business owners manage their own offers" on business_offers;
create policy "Business owners manage their own offers" on business_offers for all
  using (
    (listing_type = 'hotel' and exists (select 1 from hotels h where h.id = listing_id and h.owner_id = auth.uid()))
    or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = listing_id and r.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = listing_id and c.owner_id = auth.uid()))
    or (listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = listing_id and cs.owner_id = auth.uid()))
  )
  with check (
    (listing_type = 'hotel' and exists (select 1 from hotels h where h.id = listing_id and h.owner_id = auth.uid()))
    or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = listing_id and r.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = listing_id and c.owner_id = auth.uid()))
    or (listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = listing_id and cs.owner_id = auth.uid()))
  );
