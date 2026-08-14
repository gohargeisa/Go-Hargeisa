-- ============================================================================
-- Go Hargeisa — Table reservations: server-side guest-count cap + past-date
-- rejection, enforced in the RPC itself (not just the server action wrapper)
--
-- submit_table_reservation() already rejected guests_count < 1; this adds an
-- upper bound (50 — well above any realistic single-table party, generous
-- enough not to block a genuine large group/private-event request, but
-- enough to stop obviously malformed or abusive submissions bypassing the
-- client-side stepper). No per-business "max guests" setting exists yet
-- (that's documented future work, not built to avoid overengineering an
-- admin UI nobody can configure yet) — this is a fixed platform-wide sanity
-- check, not a business rule.
--
-- Also rejects a past reservation_date here, not only in
-- lib/actions/reservations.ts's isPastDate() check — that action is a
-- convenience wrapper, not the real trust boundary; this RPC is the one
-- anyone holding the anon key can call directly, so it needs its own
-- guarantee rather than relying on every caller re-implementing the check.
--
-- Purely a function body change (create or replace), no table/column
-- changes, no existing data touched. Safe to re-run.
-- ============================================================================

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
  if p_reservation_date < current_date then
    raise exception 'Reservation date cannot be in the past';
  end if;
  if coalesce(p_guests_count, 0) < 1 then
    raise exception 'At least 1 guest is required';
  end if;
  if p_guests_count > 50 then
    raise exception 'Reservations are limited to 50 guests — please contact the business directly for larger events';
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
