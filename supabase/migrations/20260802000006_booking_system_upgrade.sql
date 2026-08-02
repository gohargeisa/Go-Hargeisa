-- ============================================================================
-- Go Hargeisa — Booking System upgrade (Phase 5.5)
--
-- 1. hotel_rooms gets the remaining Booking.com-style fields it was missing:
--    description, bathrooms, weekend_price, discount_price, and — the
--    important one — total_rooms, a real inventory count. is_available
--    stays as the owner's manual "pause this room type entirely" switch;
--    total_rooms is what the new availability check (below) actually
--    counts against.
-- 2. room_images — a real per-room gallery. hotel_rooms.image (singular)
--    is left untouched for backward compatibility (existing rows/queries
--    keep working); room_images is additive.
-- 3. bookings.guest_country — the booking page collects it, nothing before
--    now stored it.
-- 4. room_capacity_available() — the actual double-booking fix. Until this
--    migration, NOTHING checked whether a room had capacity left for the
--    requested dates: hotel_rooms.is_available was a single on/off switch
--    with no date awareness, and room_availability (added months ago) was
--    explicitly a write-only scaffold nothing read. This function sums
--    rooms_count across overlapping pending/confirmed bookings for a room
--    and compares against total_rooms, and also checks room_availability
--    for an explicit owner-blocked date. Wired into submit_booking_request
--    (guest path) and used by lib/actions/business.ts's createBooking
--    (owner-entered path) so both paths are covered.
-- Every statement is idempotent — safe to re-run.
-- ============================================================================

alter table hotel_rooms
  add column if not exists description text,
  add column if not exists bathrooms integer not null default 1,
  add column if not exists weekend_price numeric(10,2),
  add column if not exists discount_price numeric(10,2),
  add column if not exists total_rooms integer not null default 1;

create table if not exists room_images (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references hotel_rooms(id) on delete cascade,
  url text not null,
  alt text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_room_images_room_id on room_images(room_id, sort_order);

alter table room_images enable row level security;

drop policy if exists "Public can read images of published hotel rooms" on room_images;
create policy "Public can read images of published hotel rooms" on room_images for select
  using (
    exists (
      select 1 from hotel_rooms r join hotels h on h.id = r.hotel_id
      where r.id = room_id and h.status = 'published'
    )
  );

drop policy if exists "Owners manage all room images" on room_images;
create policy "Owners manage all room images" on room_images for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

drop policy if exists "Business owners manage their room images" on room_images;
create policy "Business owners manage their room images" on room_images for all
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

alter table bookings add column if not exists guest_country text;

-- ----------------------------------------------------------------------------
-- Double-booking prevention.
-- ----------------------------------------------------------------------------
create or replace function room_capacity_available(
  p_room_id uuid,
  p_check_in date,
  p_check_out date,
  p_rooms_count integer,
  p_exclude_booking_id uuid default null
) returns boolean as $$
declare
  v_total_rooms integer;
  v_booked integer;
  v_blocked boolean;
begin
  if p_room_id is null then
    return true;
  end if;

  select total_rooms into v_total_rooms from hotel_rooms where id = p_room_id;
  if v_total_rooms is null then
    return true;
  end if;

  select coalesce(sum(rooms_count), 0) into v_booked
  from bookings
  where room_id = p_room_id
    and status in ('pending', 'confirmed')
    and (p_exclude_booking_id is null or id <> p_exclude_booking_id)
    and check_in < p_check_out and check_out > p_check_in;

  select exists (
    select 1 from room_availability
    where room_id = p_room_id and is_available = false
      and date >= p_check_in and date < p_check_out
  ) into v_blocked;

  if v_blocked then
    return false;
  end if;

  return (v_booked + coalesce(p_rooms_count, 1)) <= v_total_rooms;
end;
$$ language plpgsql stable security definer set search_path = public, pg_temp;

create or replace function public.submit_booking_request(
  p_hotel_id uuid,
  p_room_id uuid,
  p_guest_name text,
  p_guest_phone text,
  p_guest_email text,
  p_adults integer,
  p_children integer,
  p_rooms_count integer,
  p_check_in date,
  p_check_out date,
  p_notes text,
  p_guest_country text default null
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reference text;
begin
  if p_guest_name is null or btrim(p_guest_name) = '' then
    raise exception 'Full name is required';
  end if;
  if p_guest_phone is null or btrim(p_guest_phone) = '' then
    raise exception 'Phone number is required';
  end if;
  if p_check_in is null or p_check_out is null or p_check_out <= p_check_in then
    raise exception 'Check-out must be after check-in';
  end if;
  if coalesce(p_adults, 0) < 1 then
    raise exception 'At least 1 adult is required';
  end if;
  if coalesce(p_rooms_count, 0) < 1 then
    raise exception 'At least 1 room is required';
  end if;
  if not exists (select 1 from hotels where id = p_hotel_id and status = 'published') then
    raise exception 'Hotel not found';
  end if;
  if not room_capacity_available(p_room_id, p_check_in, p_check_out, p_rooms_count) then
    raise exception 'This room is no longer available for the selected dates';
  end if;

  insert into bookings (
    hotel_id, room_id, guest_name, guest_phone, guest_email, guest_country,
    guests_count, adults, children, rooms_count,
    check_in, check_out, status, notes, user_id
  ) values (
    p_hotel_id, p_room_id, btrim(p_guest_name), btrim(p_guest_phone),
    nullif(btrim(coalesce(p_guest_email, '')), ''), nullif(btrim(coalesce(p_guest_country, '')), ''),
    coalesce(p_adults, 1) + coalesce(p_children, 0), p_adults, coalesce(p_children, 0), p_rooms_count,
    p_check_in, p_check_out, 'pending', nullif(btrim(coalesce(p_notes, '')), ''), auth.uid()
  )
  returning booking_reference into v_reference;

  return v_reference;
end;
$$;
