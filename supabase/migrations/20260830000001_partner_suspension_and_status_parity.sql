-- ============================================================================
-- Go Hargeisa — Partner Suspension + city_services/services Status Parity
--
-- NOT APPLIED ANYWHERE YET. Written for review during Phase 2 (Admin/Partner
-- dashboard work) per the project owner's explicit instruction: "write the
-- migration, show me exactly what it changes, explain why, confirm
-- non-destructive, then STOP and wait for approval." Do not apply without
-- explicit sign-off.
--
-- ----------------------------------------------------------------------------
-- WHY THIS EXISTS — two separate, independent gaps found during a read-only
-- live-schema audit (2026-08-19/20), each verified directly against
-- production before writing this file:
-- ----------------------------------------------------------------------------
--
-- GAP 1 — no way to suspend a listing.
--   The platform's only publish-state concept is the SHARED enum type
--   `content_status` ('draft' | 'published' | 'archived'), used not just by
--   hotels/restaurants/cafes/city_services/services but also by `events` and
--   `site_announcements` — confirmed via a live catalog query. Adding a
--   'suspended' value directly to this shared enum (`ALTER TYPE
--   content_status ADD VALUE 'suspended'`) would leak the concept into
--   editorial content types that have nothing to do with partner suspension
--   (an announcement isn't "suspended"), and — because Postgres enum values
--   can never be removed once added — that leakage would be permanent.
--   Also, once added, every switch/lookup in the app keyed on
--   `ContentStatus`/`content_status` would need to account for a value that
--   only ever applies to 5 of the (at least) 7 tables sharing the type.
--
--   Instead, this migration adds a separate, orthogonal
--   `is_suspended boolean` column, scoped ONLY to the 5 actual
--   business-listing tables (hotels, restaurants, cafes, city_services,
--   services) — never touching `content_status` or any editorial table. A
--   listing's own draft/published/archived intent (its owner's choice) and
--   an admin's suspension (an independent override) are tracked separately,
--   which is also the more correct model: an admin suspending a listing
--   should not silently rewrite what the owner set their status to — when
--   un-suspended, the listing should return to exactly whatever
--   draft/published/archived state it was already in.
--
--   To make suspension actually take a listing offline (not just a
--   cosmetic admin-dashboard label), each table's existing "Public can read
--   published X" SELECT policy is recreated to ALSO require
--   `is_suspended = false`. Every existing row defaults to
--   `is_suspended = false`, so applying this migration changes the
--   visibility of ZERO existing listings — the new check only ever removes
--   a listing from public view once an admin explicitly sets that one row's
--   `is_suspended` to true, going forward.
--
--   Verified via a live RLS policy inventory that INSERT/DELETE on these 5
--   tables already require `profiles.role = 'owner'` (the "Owners manage
--   {table}" ALL-command policies) — that part of the permissions model was
--   already correct and needs no migration.
--
--   CORRECTION found while answering "can a suspended owner still reach
--   their own dashboard": `city_services` already has its own
--   `city_services_owner_select` SELECT policy (`owner_id = auth.uid()`),
--   but hotels/restaurants/cafes/services do NOT — their owner only ever
--   sees "their listing" via lib/data/business.ts's getOwnedListings()
--   because that query happens to also satisfy the PUBLIC "published"
--   policy today (every listing a business_owner is given is already
--   'published' at the moment ownership is assigned). Adding
--   `is_suspended = false` to that same public policy, without more, would
--   mean a suspended owner loses the ability to see their OWN dashboard
--   entirely, not just public visibility — the dashboard would just render
--   blank instead of "your business is suspended." This migration closes
--   that gap by adding the same owner-scoped SELECT policy to the other 4
--   tables, mirroring city_services' own existing pattern exactly (nothing
--   new invented) — so an owner can always see their own listing via
--   getOwnedListings() regardless of draft/published/archived/suspended
--   state, while the public policy is the one that actually gates
--   visibility to everyone else.
--
-- GAP 2 — city_services and services can't appear in the admin Partners
--   page (subscription/trial-vs-official tier management).
--   Confirmed via live schema probe: `city_services` has `status`, `owner_id`,
--   `featured` but NOT `partner_status` or `trial_expires_at`. `services` has
--   `status`, `owner_id`, `featured`, `is_pinned` but NOT `partner_status` or
--   `trial_expires_at`. `hotels`/`restaurants`/`cafes` have all of these —
--   this is why app/[locale]/admin/partners/page.tsx's query only ever
--   included those 3 tables: the columns it needs simply don't exist on the
--   other 2, so businesses like Flormar and Lavender (both `city_services`
--   rows) are structurally invisible there today, no matter how the query is
--   written.
--
--   This migration adds the SAME existing `partner_status` enum type (not a
--   new one) plus `trial_expires_at` to both tables, and `is_pinned` to
--   `city_services` only (`services` already has it) — bringing all 5
--   business-listing tables to identical shape for this purpose.
--   `business_subscriptions.listing_type` has no CHECK constraint (confirmed
--   live) — it already accepts 'city_service'/'service' rows without any
--   schema change; subscriptions for these listing types simply haven't been
--   created yet because nothing could query them.
--
--   DEFAULT VALUE — CONFIRMED by the project owner 2026-08-20: hotels/
--   restaurants/cafes' existing `partner_status` column defaults new rows to
--   'trial'. This migration defaults the BACKFILLED value for
--   city_services/services' EXISTING rows (Flormar, Lavender, any other
--   already-published business) to 'official' instead, per that
--   confirmation — because they are already-live, already-onboarded real
--   businesses, not new signups mid-trial. New rows created after this
--   migration (via join-request conversion) would need the app code to
--   explicitly set 'trial' at creation time to match how hotels/restaurants/
--   cafes are onboarded — that app-side wiring is NOT part of this file and
--   would be separate, later work.
--
-- ----------------------------------------------------------------------------
-- SAFETY
--   Purely additive: 8 new nullable-or-defaulted columns across 5 tables,
--   plus 5 recreated SELECT policies (drop-then-create the SAME policy name,
--   same table, widened USING clause) and 4 new owner-scoped SELECT policies
--   (mirroring city_services' own existing one). No table, column, row, or
--   existing policy is dropped and left unrecreated. No UPDATE/DELETE/INSERT touches
--   any existing row's data — every new boolean/enum column is populated via
--   its DEFAULT for existing rows only because `add column ... default ...`
--   is how Postgres backfills, not because this file runs any DML. Every
--   existing published listing (Lavender, Flormar, every hotel/restaurant/
--   cafe) keeps showing publicly, at the exact same URL, with the exact same
--   data, immediately after this migration runs. Idempotent, safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. is_suspended — admin-only override, independent of the owner's own
--    draft/published/archived choice. Defaults to false everywhere.
-- ---------------------------------------------------------------------------
alter table hotels add column if not exists is_suspended boolean not null default false;
alter table restaurants add column if not exists is_suspended boolean not null default false;
alter table cafes add column if not exists is_suspended boolean not null default false;
alter table city_services add column if not exists is_suspended boolean not null default false;
alter table services add column if not exists is_suspended boolean not null default false;

drop policy if exists "Public can read published hotels" on hotels;
create policy "Public can read published hotels" on hotels
  for select
  using (status = 'published' and is_suspended = false);

drop policy if exists "Public can read published restaurants" on restaurants;
create policy "Public can read published restaurants" on restaurants
  for select
  using (status = 'published' and is_suspended = false);

drop policy if exists "Public can read published cafes" on cafes;
create policy "Public can read published cafes" on cafes
  for select
  using (status = 'published' and is_suspended = false);

drop policy if exists "Public can read published city services" on city_services;
create policy "Public can read published city services" on city_services
  for select
  using (status = 'published' and is_suspended = false);

drop policy if exists "Public can read published services" on services;
create policy "Public can read published services" on services
  for select
  using (status = 'published' and is_suspended = false);

-- ---------------------------------------------------------------------------
-- 1b. Owner-scoped SELECT — mirrors city_services_owner_select (already
--     live on city_services) onto the 4 tables that don't have it yet. Lets
--     an owner always see their own listing (draft, archived, or suspended)
--     via getOwnedListings(), independent of the public-visibility policy
--     above. Does not grant read access to anyone else's listing, and does
--     not touch INSERT/UPDATE/DELETE (already covered by the existing
--     "Owners manage their {table}" / "Owners manage {table}" policies).
-- ---------------------------------------------------------------------------
drop policy if exists "hotels_owner_select" on hotels;
create policy "hotels_owner_select" on hotels
  for select
  using (owner_id = auth.uid());

drop policy if exists "restaurants_owner_select" on restaurants;
create policy "restaurants_owner_select" on restaurants
  for select
  using (owner_id = auth.uid());

drop policy if exists "cafes_owner_select" on cafes;
create policy "cafes_owner_select" on cafes
  for select
  using (owner_id = auth.uid());

drop policy if exists "services_owner_select" on services;
create policy "services_owner_select" on services
  for select
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. city_services / services — partner_status + trial_expires_at parity
--    with hotels/restaurants/cafes, reusing the EXISTING `partner_status`
--    enum type (not a new type). Backfill default for pre-existing rows is
--    'official' — see the header note above; this is the one value in this
--    file that's a judgment call, not a mechanical mirror.
-- ---------------------------------------------------------------------------
alter table city_services add column if not exists partner_status partner_status not null default 'official';
alter table city_services add column if not exists trial_expires_at timestamptz;
alter table city_services add column if not exists is_pinned boolean not null default false;

alter table services add column if not exists partner_status partner_status not null default 'official';
alter table services add column if not exists trial_expires_at timestamptz;
