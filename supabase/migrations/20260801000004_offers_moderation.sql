-- ============================================================================
-- Go Hargeisa — Offers & Promotions: full system
-- Upgrades the business_offers table added in the previous migration
-- (20260801000002) from a bare title/description/date shell into the full
-- spec: structured discount (percent or fixed amount, not free text), a
-- cover image, and an admin approval/moderation gate separate from the
-- owner's own is_active on/off toggle.
--
-- Lifecycle status (scheduled/active/expired) is deliberately NOT a stored
-- column — it's derived from starts_at/ends_at/is_active at read time (see
-- lib/utils/offer-status.ts). A stored status would drift the moment
-- "today" changes; computing it means an offer is correctly "expired" the
-- instant its end date passes, with no cron job needed.
--
-- 0 real rows at the time this was written — discount_label is dropped
-- outright rather than kept alongside the new structured fields.
-- Safe to re-run.
-- ============================================================================

alter table business_offers drop column if exists discount_label;

do $$ begin
  create type offer_discount_type as enum ('percentage', 'fixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type offer_approval_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

alter table business_offers add column if not exists discount_type offer_discount_type not null default 'percentage';
alter table business_offers add column if not exists discount_value numeric;
alter table business_offers add column if not exists coupon_code text;
alter table business_offers add column if not exists cover_image text;
alter table business_offers add column if not exists approval_status offer_approval_status not null default 'pending';
alter table business_offers add column if not exists featured boolean not null default false;

create index if not exists idx_business_offers_approval on business_offers (approval_status, is_active);

-- Public read policy now also requires admin approval, not just the
-- owner's is_active flag — an owner can no longer publish an offer
-- straight to the live site without going through moderation.
drop policy if exists "Public reads active offers for published listings" on business_offers;
create policy "Public reads approved offers for published listings" on business_offers for select
  using (
    is_active = true
    and approval_status = 'approved'
    and (
      (listing_type = 'hotel' and exists (select 1 from hotels h where h.id = listing_id and h.status = 'published'))
      or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = listing_id and r.status = 'published'))
      or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = listing_id and c.status = 'published'))
    )
  );
