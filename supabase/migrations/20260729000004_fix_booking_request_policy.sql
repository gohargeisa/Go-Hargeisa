-- ============================================================================
-- Go Hargeisa — Fix guest booking-request RLS
-- The INSERT policy added in 20260729000003 rejected anonymous inserts in
-- testing ("new row violates row-level security policy"). Re-creating it
-- with an explicit `to public` role list and making sure anon/authenticated
-- actually hold the base INSERT privilege on the table (RLS policies only
-- apply once the underlying GRANT already allows the command). Safe to re-run.
-- ============================================================================

grant insert on bookings to anon, authenticated;

drop policy if exists "Anyone can submit a booking request" on bookings;
create policy "Anyone can submit a booking request" on bookings
  for insert
  to public
  with check (status = 'pending');
