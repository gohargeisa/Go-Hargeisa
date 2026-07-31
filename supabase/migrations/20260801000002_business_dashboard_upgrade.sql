-- ============================================================================
-- Go Hargeisa — Business Owner Dashboard upgrade
-- Closes gaps found in the dashboard audit: hotels/restaurants never had
-- social links, a dedicated WhatsApp contact, or an email field (cafes
-- already got social+whatsapp-adjacent fields in an earlier pass — this
-- brings hotels/restaurants to the same shape and adds the two cafes was
-- still missing). Restaurants gets the same opening_hours_structured jsonb
-- cafes already has, so the owner dashboard can offer one shared editor.
--
-- New business_offers table: the one genuinely new concept here (no prior
-- schema/UI anywhere) — lets an owner publish a time-boxed promotion against
-- their own listing. Polymorphic listing_type/listing_id, same pattern as
-- business_metric_events/business_subscriptions (a single column can't FK
-- three tables, so ownership is checked via the ownership-lookup subquery
-- pattern those tables already use).
-- Safe to re-run.
-- ============================================================================

-- Services was never added to listing_type_business (it predates the
-- Phase 2 services table), so a service owner's dashboard visits to
-- /business/subscription, /business/messages, or any metric-tracked page
-- would either see nothing (SELECT against a value the enum can't hold)
-- or hit a hard enum-constraint error on INSERT (e.g. getOrCreateSubscription).
-- Fixes lib/data/business.ts's _getOwnedListings(), which was also never
-- querying the services table at all — together these are why service
-- owners currently can't use the dashboard.
alter type listing_type_business add value if not exists 'service';

alter table hotels add column if not exists social_instagram text;
alter table hotels add column if not exists social_facebook text;
alter table hotels add column if not exists whatsapp text;
alter table hotels add column if not exists email text;

alter table restaurants add column if not exists social_instagram text;
alter table restaurants add column if not exists social_facebook text;
alter table restaurants add column if not exists whatsapp text;
alter table restaurants add column if not exists email text;
alter table restaurants add column if not exists opening_hours_structured jsonb not null default '[]';

alter table cafes add column if not exists whatsapp text;
alter table cafes add column if not exists email text;

create table if not exists business_offers (
  id uuid primary key default gen_random_uuid(),
  listing_type listing_type_business not null,
  listing_id uuid not null,
  title text not null,
  description text,
  discount_label text,
  starts_at date,
  ends_at date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_business_offers_listing on business_offers (listing_type, listing_id);

alter table business_offers enable row level security;

drop policy if exists "Owners manage all offers" on business_offers;
create policy "Owners manage all offers" on business_offers for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

drop policy if exists "Business owners manage their own offers" on business_offers;
create policy "Business owners manage their own offers" on business_offers for all
  using (
    (listing_type = 'hotel' and exists (select 1 from hotels h where h.id = listing_id and h.owner_id = auth.uid()))
    or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = listing_id and r.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = listing_id and c.owner_id = auth.uid()))
  )
  with check (
    (listing_type = 'hotel' and exists (select 1 from hotels h where h.id = listing_id and h.owner_id = auth.uid()))
    or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = listing_id and r.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = listing_id and c.owner_id = auth.uid()))
  );

drop policy if exists "Public reads active offers for published listings" on business_offers;
create policy "Public reads active offers for published listings" on business_offers for select
  using (
    is_active = true
    and (
      (listing_type = 'hotel' and exists (select 1 from hotels h where h.id = listing_id and h.status = 'published'))
      or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = listing_id and r.status = 'published'))
      or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = listing_id and c.status = 'published'))
    )
  );
