-- ============================================================================
-- Go Hargeisa — Phase 2: City Services directory
-- A small, standalone public directory — Hospitals, Banks, Supermarkets,
-- Pharmacies. Deliberately separate from the existing (currently disabled)
-- `services` table: that table was built for a much richer 8-category
-- business-listing feature with owner claims, dashboards, and
-- subscriptions. This one has none of that by design — no owner_id, no
-- booking, no subscription linkage, name/phone/hours/maps link only.
-- Owner-only writes (same shape as attractions/events/articles). Public
-- reads published rows. No rows are seeded by this migration — the
-- directory ships empty; the owner populates it from /admin/city-services.
-- Safe to re-run.
-- ============================================================================

do $$ begin
  create type city_service_category as enum ('hospital', 'bank', 'supermarket', 'pharmacy');
exception when duplicate_object then null;
end $$;

create table if not exists city_services (
  id uuid primary key default gen_random_uuid(),
  category city_service_category not null,
  name text not null,
  phone text,
  opening_hours text,
  maps_url text,
  image text,
  status content_status not null default 'published',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_city_services_lookup on city_services (category, status, sort_order);

alter table city_services enable row level security;

drop policy if exists "Public can read published city services" on city_services;
create policy "Public can read published city services" on city_services
  for select
  using (status = 'published');

drop policy if exists "Owners manage city services" on city_services;
create policy "Owners manage city services" on city_services
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));
