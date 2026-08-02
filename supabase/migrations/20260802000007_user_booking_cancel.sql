-- ============================================================================
-- Go Hargeisa — Users can cancel their own booking, per the same policy
-- lib/actions/bookings.ts enforces in the app: only pending/confirmed, and
-- only more than 24h before check-in. RLS mirrors that window as a
-- defense-in-depth backstop (the app check alone isn't authoritative), and
-- the WITH CHECK clause means this policy can only ever be used to flip a
-- booking to 'cancelled' — nothing else about the row is writable through it.
-- Safe to re-run.
-- ============================================================================

drop policy if exists "Users cancel their own booking" on bookings;
create policy "Users cancel their own booking" on bookings for update
  using (
    user_id = auth.uid()
    and status in ('pending', 'confirmed')
    and check_in::timestamptz - now() > interval '24 hours'
  )
  with check (
    user_id = auth.uid()
    and status = 'cancelled'
  );
