-- ============================================================================
-- Go Hargeisa — Business Owner Dashboard
-- Adds the minimal real tables the new /business dashboard needs: metric
-- events (views/clicks), bookings, review replies/reports, subscription
-- tier, and an inbound-message inbox. Every table follows the same
-- ownership RLS pattern already proven on hotel_rooms
-- (supabase/migrations/add_hotel_details_upgrade.sql). Safe to re-run.
-- ============================================================================

create type listing_type_business as enum ('hotel', 'restaurant', 'cafe');
create type business_event_type as enum ('view', 'website_click', 'call_click', 'whatsapp_click');
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type subscription_tier as enum ('standard', 'premium');

-- ----------------------------------------------------------------------------
-- METRIC EVENTS — real, anonymous-writable counters. Deliberately separate
-- from `activity_logs` (owner-only audit log tied to signed-in actions) so
-- public traffic counters don't fight with that table's semantics/RLS.
-- ----------------------------------------------------------------------------
create table if not exists business_metric_events (
  id uuid primary key default uuid_generate_v4(),
  listing_type listing_type_business not null,
  listing_id uuid not null,
  event_type business_event_type not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_business_metric_events_lookup
  on business_metric_events (listing_type, listing_id, event_type, created_at);

alter table business_metric_events enable row level security;

drop policy if exists "Anyone can record a metric event" on business_metric_events;
create policy "Anyone can record a metric event" on business_metric_events
  for insert with check (true);

drop policy if exists "Owners read their own metric events" on business_metric_events;
create policy "Owners read their own metric events" on business_metric_events
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'owner')
    or (listing_type = 'hotel' and exists (select 1 from hotels h where h.id = listing_id and h.owner_id = auth.uid()))
    or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = listing_id and r.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = listing_id and c.owner_id = auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- BOOKINGS — hotel-shaped (room/guests/check-in/check-out), manually
-- entered by the business owner for now; a real guest-facing reservation
-- flow is future work (see the dashboard's "Future Ready" notes).
-- ----------------------------------------------------------------------------
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  room_id uuid references hotel_rooms(id) on delete set null,
  guest_name text not null,
  guest_phone text,
  guest_email text,
  guests_count integer not null default 1,
  check_in date not null,
  check_out date not null,
  status booking_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_hotel_id on bookings (hotel_id, check_in desc);

alter table bookings enable row level security;

drop policy if exists "Owners manage all bookings" on bookings;
create policy "Owners manage all bookings" on bookings for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

drop policy if exists "Business owners manage their hotel bookings" on bookings;
create policy "Business owners manage their hotel bookings" on bookings for all
  using (
    exists (
      select 1 from hotels h join profiles p on p.id = auth.uid()
      where h.id = hotel_id and h.owner_id = auth.uid() and p.role = 'business_owner'
    )
  )
  with check (
    exists (
      select 1 from hotels h join profiles p on p.id = auth.uid()
      where h.id = hotel_id and h.owner_id = auth.uid() and p.role = 'business_owner'
    )
  );

-- ----------------------------------------------------------------------------
-- REVIEWS — owner reply + report flag (additive; every existing row
-- defaults to null/false, so public review rendering is unaffected)
-- ----------------------------------------------------------------------------
alter table reviews
  add column if not exists owner_reply text,
  add column if not exists owner_reply_at timestamptz,
  add column if not exists is_reported boolean not null default false;

-- ----------------------------------------------------------------------------
-- SUBSCRIPTIONS — real plan_tier/renewal columns, no fake billing. Every
-- listing defaults to 'standard' the first time its dashboard loads.
-- ----------------------------------------------------------------------------
create table if not exists business_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  listing_type listing_type_business not null,
  listing_id uuid not null,
  plan_tier subscription_tier not null default 'standard',
  renews_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_type, listing_id)
);

alter table business_subscriptions enable row level security;

drop policy if exists "Owners manage all subscriptions" on business_subscriptions;
create policy "Owners manage all subscriptions" on business_subscriptions for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

drop policy if exists "Business owners manage their own subscription" on business_subscriptions;
create policy "Business owners manage their own subscription" on business_subscriptions for all
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

-- ----------------------------------------------------------------------------
-- MESSAGES — real inbox schema, read/manage-only for now (no public
-- "contact this business" form exists yet to write into it — see plan notes)
-- ----------------------------------------------------------------------------
create table if not exists business_messages (
  id uuid primary key default uuid_generate_v4(),
  listing_type listing_type_business not null,
  listing_id uuid not null,
  sender_name text not null,
  sender_email text,
  sender_phone text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_business_messages_lookup on business_messages (listing_type, listing_id, created_at desc);

alter table business_messages enable row level security;

drop policy if exists "Owners manage all messages" on business_messages;
create policy "Owners manage all messages" on business_messages for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

drop policy if exists "Business owners manage their own messages" on business_messages;
create policy "Business owners manage their own messages" on business_messages for all
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
