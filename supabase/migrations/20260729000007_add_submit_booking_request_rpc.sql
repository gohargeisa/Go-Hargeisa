-- ============================================================================
-- Go Hargeisa — Fix guest booking requests (RLS-on-RETURNING conflict)
-- submitBookingRequest() (lib/actions/bookings.ts) does
-- `.insert(...).select("booking_reference").single()` so it can hand the
-- guest their reference number. Postgres governs INSERT ... RETURNING by the
-- table's SELECT policies, not just the INSERT policy — and `bookings` only
-- grants SELECT to the hotel's owner/business_owner or `user_id = auth.uid()`.
-- A signed-in guest satisfies that last clause, but a true anonymous visitor
-- (auth.uid() is null) never does, so Postgres raises the same 42501 "new row
-- violates row-level security policy" on the RETURNING clause even though the
-- INSERT itself is allowed. Confirmed by a live anon-key test against this
-- project (2026-07-29).
--
-- Fix: a SECURITY DEFINER RPC that performs the insert (bypassing RLS the
-- same way handle_new_user()/refresh_listing_rating() already do in
-- schema.sql) and hands back only the generated reference — never the full
-- row, so it can't be used to read other guests' bookings. All the app-level
-- guardrails from the original policy are re-asserted inside the function:
-- status is hardcoded to 'pending' (never a parameter), user_id always comes
-- from auth.uid() (never a parameter, so nobody can submit a booking as
-- someone else), and the target hotel must exist and be published.
--
-- Existing INSERT policy/grant on `bookings` (added in
-- 20260729000003/20260729000004) is left untouched — this RPC is an
-- additional path, not a replacement, so anything still calling
-- `.from("bookings").insert(...)` without `.select()` keeps working exactly
-- as before. No existing data is touched. Safe to re-run.
-- ============================================================================

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
  p_notes text
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

  insert into bookings (
    hotel_id, room_id, guest_name, guest_phone, guest_email,
    guests_count, adults, children, rooms_count,
    check_in, check_out, status, notes, user_id
  ) values (
    p_hotel_id, p_room_id, btrim(p_guest_name), btrim(p_guest_phone),
    nullif(btrim(coalesce(p_guest_email, '')), ''),
    coalesce(p_adults, 1) + coalesce(p_children, 0), p_adults, coalesce(p_children, 0), p_rooms_count,
    p_check_in, p_check_out, 'pending', nullif(btrim(coalesce(p_notes, '')), ''), auth.uid()
  )
  returning booking_reference into v_reference;

  return v_reference;
end;
$$;

revoke all on function public.submit_booking_request(uuid, uuid, text, text, text, integer, integer, integer, date, date, text) from public;
grant execute on function public.submit_booking_request(uuid, uuid, text, text, text, integer, integer, integer, date, date, text) to anon, authenticated;
