-- ============================================================================
-- Go Hargeisa — Table reservation reference generator + guest-safe submit RPC
--
-- Mirrors two already-proven pieces of the hotel booking system exactly:
--   1. A dedicated sequence + BEFORE INSERT trigger that stamps a
--      human-readable reference (set_booking_reference() /
--      20260729000005_upgrade_booking_system.sql), just with its own
--      sequence and an "RES-" prefix instead of "GH-" so reservation
--      references are visually distinct from hotel booking references.
--   2. A SECURITY DEFINER RPC (submit_booking_request() /
--      20260729000007_add_submit_booking_request_rpc.sql) — Postgres governs
--      INSERT ... RETURNING by the table's SELECT policies, not just INSERT,
--      and table_reservations' SELECT policy only grants read access to the
--      business owner or `user_id = auth.uid()`. A true anonymous visitor
--      (auth.uid() is null, the common case for a walk-up reservation
--      request) would hit the same 42501 RLS error on RETURNING that the
--      2026-07-29 hotel-booking fix documents. Building this RPC now avoids
--      shipping the same known bug a second time.
--
-- listing_type/listing_id are always caller-supplied and validated against
-- the real restaurants/cafes tables — nothing here is specific to any one
-- business, and no business id is hardcoded.
--
-- Safe to re-run.
-- ============================================================================

create sequence if not exists table_reservation_reference_seq start with 1;

create or replace function set_table_reservation_reference() returns trigger as $$
begin
  if new.reservation_reference is null or btrim(new.reservation_reference) = '' then
    new.reservation_reference := 'RES-' || extract(year from now())::text || '-' ||
      lpad(nextval('table_reservation_reference_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_table_reservation_reference on table_reservations;
create trigger trg_set_table_reservation_reference
  before insert on table_reservations
  for each row execute procedure set_table_reservation_reference();

create or replace function public.submit_table_reservation(
  p_listing_type listing_type_business,
  p_listing_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_reservation_date date,
  p_reservation_time time,
  p_guests_count integer,
  p_notes text
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reference text;
  v_eligible boolean;
begin
  if p_customer_name is null or btrim(p_customer_name) = '' then
    raise exception 'Name is required';
  end if;
  if p_customer_phone is null or btrim(p_customer_phone) = '' then
    raise exception 'Phone number is required';
  end if;
  if p_reservation_date is null or p_reservation_time is null then
    raise exception 'Date and time are required';
  end if;
  if coalesce(p_guests_count, 0) < 1 then
    raise exception 'At least 1 guest is required';
  end if;
  if p_listing_type not in ('restaurant', 'cafe') then
    raise exception 'Reservations are only available for restaurants and cafes';
  end if;

  if p_listing_type = 'restaurant' then
    select exists(
      select 1 from restaurants where id = p_listing_id and status = 'published' and reservable = true
    ) into v_eligible;
  else
    select exists(
      select 1 from cafes where id = p_listing_id and status = 'published' and reservable = true
    ) into v_eligible;
  end if;

  if not v_eligible then
    raise exception 'Reservations are not available for this listing';
  end if;

  insert into table_reservations (
    listing_type, listing_id, customer_name, customer_phone,
    reservation_date, reservation_time, guests_count, notes, status, user_id
  ) values (
    p_listing_type, p_listing_id, btrim(p_customer_name), btrim(p_customer_phone),
    p_reservation_date, p_reservation_time, coalesce(p_guests_count, 2),
    nullif(btrim(coalesce(p_notes, '')), ''), 'pending', auth.uid()
  )
  returning reservation_reference into v_reference;

  return v_reference;
end;
$$;

revoke all on function public.submit_table_reservation(listing_type_business, uuid, text, text, date, time, integer, text) from public;
grant execute on function public.submit_table_reservation(listing_type_business, uuid, text, text, date, time, integer, text) to anon, authenticated;
