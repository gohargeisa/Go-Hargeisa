-- ============================================================================
-- Go Hargeisa — Fix remaining anon/authenticated INSERT grants
-- Same root cause documented in 20260729000004_fix_booking_request_policy.sql:
-- an RLS policy's WITH CHECK is only ever evaluated once the role already
-- holds the base Postgres INSERT privilege on the table — a policy alone,
-- even "with check (true)", does nothing without it. That migration fixed
-- `bookings`; these tables have the identical anon-insert policy shape but
-- were never granted the base privilege, so they're very likely still
-- silently rejecting real (unauthenticated) visitor writes today. Safe to
-- re-run.
-- ============================================================================

-- Claim this Business (public, unauthenticated visitors)
-- Policy: "Anyone can submit a business claim" (20260728000010_add_business_claims.sql)
grant insert on business_claims to anon, authenticated;

-- View / website-click / call-click / WhatsApp-click counters (public, unauthenticated visitors)
-- Policy: "Anyone can record a metric event" (add_business_dashboard.sql)
grant insert on business_metric_events to anon, authenticated;

-- Contact form (public, unauthenticated visitors)
-- Policy: "Anyone can send a contact message" (schema.sql)
grant insert on contact_messages to anon, authenticated;

-- Newsletter signup (public, unauthenticated visitors)
-- Policy: "Anyone can subscribe to newsletter" (schema.sql)
grant insert on newsletter_subscribers to anon, authenticated;

-- ----------------------------------------------------------------------------
-- ACTIVITY LOG — add_infrastructure.sql enabled RLS on activity_logs with
-- only a SELECT policy; there was never an INSERT policy at all, so every
-- call to lib/actions/activity.ts's logActivity() (used today by the owner
-- "Site Settings" save action) has been silently rejected by RLS and
-- swallowed by its own try/catch — the audit trail has never recorded a
-- single row. Authenticated users may insert only their own log entry,
-- matching exactly how logActivity() always sets user_id from the signed-in
-- session.
-- ----------------------------------------------------------------------------
grant insert on activity_logs to authenticated;

drop policy if exists "Users insert own activity" on activity_logs;
create policy "Users insert own activity" on activity_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);
