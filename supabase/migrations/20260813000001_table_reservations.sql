-- ============================================================================
-- Go Hargeisa — Reusable Table Reservation System (Restaurants + Cafes)
--
-- Adds ONE new table shared by every restaurant and cafe on the platform,
-- not a Sultan-specific feature. Reuses two enum types that already exist
-- rather than inventing new ones:
--   - listing_type_business (hotel|restaurant|cafe) — same polymorphic
--     pattern already proven by business_metric_events
--     (add_business_dashboard.sql). Hotels keep using their own `bookings`
--     table; this table is only ever written with 'restaurant' or 'cafe'.
--   - booking_status (pending|confirmed|cancelled|completed) — same enum
--     hotel bookings already use, so reservation statuses match exactly
--     what the rest of the app already understands.
--
-- `restaurants.reservable` already exists. `cafes` has no equivalent column
-- at all, so this migration adds one — every cafe defaults to false
-- (reservations off) until a business explicitly turns it on.
--
-- Purely additive, safe to re-run.
-- ============================================================================

create table if not exists table_reservations (
  id uuid primary key default gen_random_uuid(),
  listing_type listing_type_business not null,
  listing_id uuid not null,
  customer_name text not null,
  customer_phone text not null,
  reservation_date date not null,
  reservation_time time without time zone not null,
  guests_count integer not null default 2,
  notes text,
  status booking_status not null default 'pending',
  reservation_reference text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_table_reservations_listing
  on table_reservations (listing_type, listing_id, reservation_date desc);

alter table cafes add column if not exists reservable boolean not null default false;

alter table table_reservations enable row level security;

-- Platform admin — full access, same bypass every other business table grants.
drop policy if exists "Owners manage all table reservations" on table_reservations;
create policy "Owners manage all table reservations" on table_reservations for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

-- Business owner — full access to reservations on their own restaurant/cafe only.
-- Dynamic lookup against listing_type/listing_id, never a hardcoded business id.
drop policy if exists "Business owners manage their listing reservations" on table_reservations;
create policy "Business owners manage their listing reservations" on table_reservations for all
  using (
    (listing_type = 'restaurant' and exists (
      select 1 from restaurants r join profiles p on p.id = auth.uid()
      where r.id = listing_id and r.owner_id = auth.uid() and p.role = 'business_owner'
    ))
    or (listing_type = 'cafe' and exists (
      select 1 from cafes c join profiles p on p.id = auth.uid()
      where c.id = listing_id and c.owner_id = auth.uid() and p.role = 'business_owner'
    ))
  )
  with check (
    (listing_type = 'restaurant' and exists (
      select 1 from restaurants r join profiles p on p.id = auth.uid()
      where r.id = listing_id and r.owner_id = auth.uid() and p.role = 'business_owner'
    ))
    or (listing_type = 'cafe' and exists (
      select 1 from cafes c join profiles p on p.id = auth.uid()
      where c.id = listing_id and c.owner_id = auth.uid() and p.role = 'business_owner'
    ))
  );

-- Public — anyone (including signed-out visitors) can submit a reservation
-- REQUEST, but only for a listing that is actually published and has
-- reservations enabled — enforced here, not just in application code, so
-- the guarantee holds even if a server action has a bug. No public select:
-- a requester never sees other customers' reservations.
drop policy if exists "Anyone can request a reservation for an eligible listing" on table_reservations;
create policy "Anyone can request a reservation for an eligible listing" on table_reservations
  for insert with check (
    (listing_type = 'restaurant' and exists (
      select 1 from restaurants r where r.id = listing_id and r.status = 'published' and r.reservable = true
    ))
    or (listing_type = 'cafe' and exists (
      select 1 from cafes c where c.id = listing_id and c.status = 'published' and c.reservable = true
    ))
  );

-- Signed-in customers can see their own past reservation requests (parity
-- with how hotel bookings/appointments already let a signed-in user track
-- their own history via user_id).
drop policy if exists "Customers view their own reservations" on table_reservations;
create policy "Customers view their own reservations" on table_reservations for select
  using (user_id = auth.uid());
