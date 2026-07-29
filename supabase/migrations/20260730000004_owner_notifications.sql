-- ============================================================================
-- Go Hargeisa — Phase 3: Owner Control Center notifications
-- lib/actions/notifications.ts (createNotification/getUserNotifications/
-- markNotificationAsRead) has existed since an earlier phase but nothing
-- ever called createNotification, so the notifications table has never had
-- a row in it. This wires up the two genuinely owner-only workflows that
-- already exist in the schema (business_claims and contact_messages both
-- already have "Owners manage/read ..." RLS policies, i.e. they were
-- already conceptually owner-facing) so the new Owner Control Center's
-- notification bell has real events to show, not an empty inbox forever.
-- SECURITY DEFINER (matching enforce_partner_status_owner_only's pattern)
-- so the insert runs with elevated privileges regardless of who/what
-- triggered the parent row (an anonymous guest submitting a claim or
-- contact form has no INSERT grant on notifications, nor should they).
-- Safe to re-run.
-- ============================================================================

create or replace function notify_owners_new_business_claim() returns trigger as $$
begin
  insert into notifications (user_id, title, message, type, action_url)
  select id, 'New business claim', new.full_name || ' wants to claim a listing', 'info', '/admin/partners'
  from profiles where role = 'owner';
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_business_claim on business_claims;
create trigger trg_notify_new_business_claim
  after insert on business_claims
  for each row execute procedure notify_owners_new_business_claim();

create or replace function notify_owners_new_contact_message() returns trigger as $$
begin
  insert into notifications (user_id, title, message, type, action_url)
  select id, 'New contact message', new.name || ': ' || left(new.message, 80), 'info', '/admin'
  from profiles where role = 'owner';
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_contact_message on contact_messages;
create trigger trg_notify_new_contact_message
  after insert on contact_messages
  for each row execute procedure notify_owners_new_contact_message();
