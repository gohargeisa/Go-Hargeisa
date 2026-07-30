-- ============================================================================
-- Go Hargeisa — Phase 4 Stage 7: Social media policy / general announcements
-- This stage is a policy layer, not a third-party integration: there is no
-- Facebook/Instagram/X posting anywhere in this codebase, and nothing in
-- the spec names a platform, API, or credential (contrast with Payments in
-- Stage 12, which explicitly calls out future Stripe/Zaad/eDahab
-- integration) — so "eligible for social media promotion" is treated as
-- an internal policy fact, not a feature to wire up.
--
-- Trial-vs-official eligibility needs no new column: it's already fully
-- determined by the existing partner_status ('trial' | 'official') on
-- hotels/restaurants/cafes — surfaced in the UI (components/admin/
-- partners-list.tsx), not duplicated into new schema.
--
-- The one genuinely new, concretely buildable piece is "Allow Owner to
-- publish a general announcement" — a real, minimal broadcast mechanism:
-- the owner writes one, publishes it, and it shows as a homepage banner
-- until unpublished. Same CRUD shape as city_services (owner-only writes,
-- public reads only published rows).
-- Safe to re-run.
-- ============================================================================

create table if not exists site_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  link_url text,
  link_label text,
  status content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_site_announcements_status
  on site_announcements (status, created_at desc);

alter table site_announcements enable row level security;

drop policy if exists "Public can read published announcements" on site_announcements;
create policy "Public can read published announcements" on site_announcements
  for select
  using (status = 'published');

drop policy if exists "Owners manage announcements" on site_announcements;
create policy "Owners manage announcements" on site_announcements
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));
