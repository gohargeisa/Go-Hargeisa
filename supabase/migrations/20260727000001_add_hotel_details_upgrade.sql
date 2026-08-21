-- ============================================================================
-- Go Hargeisa — Hotel Details Page Upgrade
-- Run this in the Supabase SQL editor (or `supabase db push`) after
-- schema.sql and add_infrastructure.sql are already applied. Every
-- statement is guarded with IF NOT EXISTS so it's safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- HOTELS — logo, check-in/out, languages, optional on-site restaurant/cafe
-- ----------------------------------------------------------------------------
alter table hotels
  add column if not exists logo_url text,
  add column if not exists check_in_time text,
  add column if not exists check_out_time text,
  add column if not exists languages text[] not null default '{}',
  add column if not exists restaurant_id uuid references restaurants(id) on delete set null,
  add column if not exists cafe_id uuid references cafes(id) on delete set null;

create index if not exists idx_hotels_restaurant_id on hotels(restaurant_id);
create index if not exists idx_hotels_cafe_id on hotels(cafe_id);

-- ----------------------------------------------------------------------------
-- HOTEL ROOMS
-- ----------------------------------------------------------------------------
create table if not exists hotel_rooms (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  name text not null,
  image text,
  size_sqm integer,
  max_guests integer not null default 2,
  bed_type text,
  features text[] not null default '{}',
  price_per_night numeric(10,2),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hotel_rooms_hotel_id on hotel_rooms(hotel_id);

alter table hotel_rooms enable row level security;

drop policy if exists "Public can read rooms of published hotels" on hotel_rooms;
create policy "Public can read rooms of published hotels" on hotel_rooms for select
  using (exists (select 1 from hotels h where h.id = hotel_id and h.status = 'published'));

drop policy if exists "Owners manage all hotel rooms" on hotel_rooms;
create policy "Owners manage all hotel rooms" on hotel_rooms for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

drop policy if exists "Business owners manage their hotel rooms" on hotel_rooms;
create policy "Business owners manage their hotel rooms" on hotel_rooms for all
  using (
    exists (
      select 1 from hotels h
      join profiles p on p.id = auth.uid()
      where h.id = hotel_id and h.owner_id = auth.uid() and p.role = 'business_owner'
    )
  )
  with check (
    exists (
      select 1 from hotels h
      join profiles p on p.id = auth.uid()
      where h.id = hotel_id and h.owner_id = auth.uid() and p.role = 'business_owner'
    )
  );

-- ----------------------------------------------------------------------------
-- REVIEWS — optional guest photos (additive; existing rows default to '[]',
-- so restaurant/cafe/attraction reviews are visually unaffected)
-- ----------------------------------------------------------------------------
alter table reviews
  add column if not exists photos jsonb not null default '[]';
