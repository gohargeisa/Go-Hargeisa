-- ============================================================================
-- Go Hargeisa — Phase 2: Essential City Services
-- One unified `services` table for all 8 new categories (hospitals,
-- pharmacies, dental clinics, banks, ATMs, currency exchange, gas stations,
-- car rentals) rather than 8 near-identical tables — they share the same
-- shape (name/address/coordinates/phone/hours/services-offered) and only
-- differ by category, matching the hotels/restaurants/cafes column pattern
-- and RLS style exactly. Safe to re-run.
-- ============================================================================

create type service_category as enum (
  'hospital', 'pharmacy', 'dental_clinic', 'bank', 'atm', 'currency_exchange', 'gas_station', 'car_rental'
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_ar text,
  name_so text,
  short_description text not null,
  description text not null,
  cover_image text not null,
  gallery jsonb not null default '[]',
  address text not null,
  lat double precision not null,
  lng double precision not null,
  phone text,
  website text,
  opening_hours text,
  services text[] not null default '{}',
  category service_category not null,
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  featured boolean not null default false,
  status content_status not null default 'published',
  owner_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_services_category on services(category);
create index if not exists idx_services_status on services(status);
create index if not exists idx_services_featured on services(featured);
create index if not exists idx_services_owner_id on services(owner_id);

alter table services enable row level security;

drop policy if exists "Public can read published services" on services;
create policy "Public can read published services" on services for select using (status = 'published');

drop policy if exists "Owners manage services" on services;
create policy "Owners manage services" on services for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

drop policy if exists "Owners manage their services" on services;
create policy "Owners manage their services" on services for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Reuse the existing business_claims / business_metric_events machinery
-- (Claim this Business button, view/call/website click tracking) for
-- services too, instead of building a parallel system.
alter type listing_type_business add value if not exists 'service';
