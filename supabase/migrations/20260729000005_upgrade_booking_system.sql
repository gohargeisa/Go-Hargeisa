-- ============================================================================
-- Go Hargeisa — Hotel Booking System Upgrade
-- Adds room categorization + per-room availability, richer per-booking guest
-- breakdown (adults/children/rooms), auto-generated booking references,
-- a booking status audit trail, a scalable (currently-unused) per-date room
-- availability scaffold, payment-architecture placeholder columns (no
-- gateway wired up yet — see lib/actions/bookings.ts), and lets a logged-in
-- guest's own bookings show up in their dashboard. Every statement is
-- idempotent — safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ROOM TYPE + PER-ROOM AVAILABILITY
-- ----------------------------------------------------------------------------
do $$ begin
  create type room_type as enum ('standard', 'deluxe', 'twin', 'family', 'executive_suite');
exception when duplicate_object then null;
end $$;

alter table hotel_rooms
  add column if not exists room_type room_type not null default 'standard',
  add column if not exists is_available boolean not null default true;

-- Scaffold for future date-range availability (e.g. a room fully booked for
-- a specific week). Not read by the app yet — hotel_rooms.is_available is
-- the current simple on/off toggle owners use — but the shape exists now so
-- a real calendar feature later is an additive read, not a schema change.
create table if not exists room_availability (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references hotel_rooms(id) on delete cascade,
  date date not null,
  is_available boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  unique (room_id, date)
);

create index if not exists idx_room_availability_room_id on room_availability(room_id, date);

alter table room_availability enable row level security;

drop policy if exists "Public can read room availability of published hotels" on room_availability;
create policy "Public can read room availability of published hotels" on room_availability for select
  using (
    exists (
      select 1 from hotel_rooms r join hotels h on h.id = r.hotel_id
      where r.id = room_id and h.status = 'published'
    )
  );

drop policy if exists "Owners manage all room availability" on room_availability;
create policy "Owners manage all room availability" on room_availability for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

drop policy if exists "Business owners manage their room availability" on room_availability;
create policy "Business owners manage their room availability" on room_availability for all
  using (
    exists (
      select 1 from hotel_rooms r join hotels h on h.id = r.hotel_id join profiles p on p.id = auth.uid()
      where r.id = room_id and h.owner_id = auth.uid() and p.role = 'business_owner'
    )
  )
  with check (
    exists (
      select 1 from hotel_rooms r join hotels h on h.id = r.hotel_id join profiles p on p.id = auth.uid()
      where r.id = room_id and h.owner_id = auth.uid() and p.role = 'business_owner'
    )
  );

-- ----------------------------------------------------------------------------
-- BOOKINGS — richer guest breakdown, booking reference, payment placeholder,
-- and an optional link back to the submitting guest's own account.
-- ----------------------------------------------------------------------------
do $$ begin
  create type payment_status as enum ('unpaid', 'pending', 'paid', 'refunded');
exception when duplicate_object then null;
end $$;

-- Not an enum: new payment providers (Stripe/PayPal/Zaad/eDahab/card
-- networks) will be added over time without a schema migration each time.
alter table bookings
  add column if not exists adults integer not null default 1,
  add column if not exists children integer not null default 0,
  add column if not exists rooms_count integer not null default 1,
  add column if not exists booking_reference text unique,
  add column if not exists payment_status payment_status not null default 'unpaid',
  add column if not exists payment_method text,
  add column if not exists user_id uuid references profiles(id) on delete set null;

create index if not exists idx_bookings_user_id on bookings(user_id);
create index if not exists idx_bookings_reference on bookings(booking_reference);

-- Auto-generates human-readable references like GH-2026-000123. A single
-- shared sequence (not per-year) keeps this trivial and collision-free;
-- the year is read at insert time so the visible prefix still rolls over.
create sequence if not exists booking_reference_seq start with 1;

create or replace function set_booking_reference() returns trigger as $$
begin
  if new.booking_reference is null then
    new.booking_reference := 'GH-' || extract(year from now())::text || '-' ||
      lpad(nextval('booking_reference_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_booking_reference on bookings;
create trigger trg_set_booking_reference
  before insert on bookings
  for each row execute procedure set_booking_reference();

-- Backfill existing rows (owner-entered bookings from before this migration)
-- so every booking has a reference, not just new ones.
update bookings set booking_reference =
  'GH-' || extract(year from created_at)::text || '-' || lpad(nextval('booking_reference_seq')::text, 6, '0')
where booking_reference is null;

drop policy if exists "Users view their own bookings" on bookings;
create policy "Users view their own bookings" on bookings for select
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- BOOKING STATUS HISTORY — audit trail every status change appends to,
-- populated from lib/actions/business.ts's updateBookingStatus.
-- ----------------------------------------------------------------------------
create table if not exists booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  old_status booking_status,
  new_status booking_status not null,
  changed_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_booking_status_history_booking_id on booking_status_history(booking_id, created_at desc);

alter table booking_status_history enable row level security;

drop policy if exists "Owners manage all booking history" on booking_status_history;
create policy "Owners manage all booking history" on booking_status_history for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

drop policy if exists "Business owners manage their booking history" on booking_status_history;
create policy "Business owners manage their booking history" on booking_status_history for all
  using (
    exists (
      select 1 from bookings b join hotels h on h.id = b.hotel_id join profiles p on p.id = auth.uid()
      where b.id = booking_id and h.owner_id = auth.uid() and p.role = 'business_owner'
    )
  )
  with check (
    exists (
      select 1 from bookings b join hotels h on h.id = b.hotel_id join profiles p on p.id = auth.uid()
      where b.id = booking_id and h.owner_id = auth.uid() and p.role = 'business_owner'
    )
  );

drop policy if exists "Users view their own booking history" on booking_status_history;
create policy "Users view their own booking history" on booking_status_history for select
  using (exists (select 1 from bookings b where b.id = booking_id and b.user_id = auth.uid()));
