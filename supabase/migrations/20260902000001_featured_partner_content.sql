-- ============================================================================
-- Go Hargeisa — Featured Partner Content (Smart Featured Partners homepage
-- section, optional per-partner promo override)
--
-- NOT APPLIED ANYWHERE YET — written for review, matching this session's
-- established pattern for every other pending migration. Do not apply
-- without explicit sign-off.
--
-- WHAT THIS IS FOR
--   The homepage "Featured Partners" section reuses the EXISTING
--   `is_partner` flag (hotels/restaurants/cafes/services/city_services, from
--   20260815000001_add_is_partner_flag.sql — already live in production) to
--   decide WHICH businesses appear. No new "is featured" boolean needed;
--   `is_partner` already means exactly that ("manual, owner-controlled GO
--   HARGEISA PARTNER status... only an authorized admin can flip it").
--
--   What's genuinely new here is OPTIONAL custom promotional content — a
--   headline, a CTA label, and a CTA destination — for a specific partner,
--   for when Go Hargeisa wants to run a special campaign for one business
--   instead of the automatic, category-derived template (see
--   lib/data/featured-partner-showcase.ts). One partner in five tables, so
--   this follows the same polymorphic (listing_type, listing_id) pattern
--   already established by business_offers/business_access_grants rather
--   than adding 3 nullable columns to 5 different tables.
--
-- SAFETY
--   Purely additive. New table only — no existing table, column, or RLS
--   policy touched. A row existing (or not) here has zero effect on any
--   other feature; the homepage section falls back to its own category
--   template whenever no row exists for a partner.
-- ============================================================================

create table featured_partner_content (
  id uuid primary key default gen_random_uuid(),
  listing_type text not null check (listing_type in ('hotel', 'restaurant', 'cafe', 'service', 'city_service')),
  listing_id uuid not null,
  promo_text text,
  promo_text_ar text,
  promo_text_so text,
  cta_label text,
  cta_label_ar text,
  cta_label_so text,
  cta_href text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_type, listing_id)
);

create index if not exists idx_featured_partner_content_listing on featured_partner_content (listing_type, listing_id);

alter table featured_partner_content enable row level security;

-- Public (anon/authenticated) read — the homepage section is public, same
-- reasoning as "Public reads approved offers for published listings".
-- Existence of a row doesn't imply the listing itself is featured/published;
-- the app layer only ever queries this for listings it already fetched as
-- is_partner=true AND status='published'.
create policy "Public reads featured partner content" on featured_partner_content for select
  using (true);

-- Admin-only writes — mirrors is_partner's own "only an authorized admin can
-- flip it" rule (this table only has content for already is_partner=true
-- listings, and that flag itself is admin-only), not a business-owner
-- self-service field.
create policy "Owners manage featured partner content" on featured_partner_content for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));
