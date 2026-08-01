-- ============================================================================
-- Go Hargeisa — Complete Notifications System
-- Upgrades the notifications table (add_infrastructure.sql) from a bare
-- title/message shell into a fully event-driven system covering every
-- audience: platform admins (role = 'owner'), business owners, and guests.
--
-- Two new columns carry the structured event so the UI can render it in
-- the visitor's own language (en/ar/so) instead of the frozen English
-- string the three pre-existing triggers insert:
--   category — a stable event key (e.g. 'booking_new') the client maps to
--              a translated title/body via lib/utils/notification-text.ts.
--   data     — jsonb payload of the raw values needed to render that
--              string (listing name, guest name, status, etc.), captured
--              at event time so the notification stays historically
--              accurate even if the listing is later renamed/deleted.
-- title/message are still populated (English) as a safe fallback for any
-- notification whose category the client doesn't recognise.
--
-- Every new trigger follows the exact SECURITY DEFINER pattern established
-- by notify_owners_new_business_claim (20260730000004) — bypasses RLS so
-- the insert works regardless of who/what triggered the parent row (an
-- anonymous guest booking a room has no INSERT grant on notifications,
-- nor should they).
-- Safe to re-run.
-- ============================================================================

alter table notifications add column if not exists category text;
alter table notifications add column if not exists data jsonb not null default '{}'::jsonb;

create index if not exists idx_notifications_category on notifications(category);

-- ----------------------------------------------------------------------------
-- RLS — the recipient can now mark their own notifications read/unread.
-- (Only SELECT + DELETE existed before; every write path stayed
-- SECURITY DEFINER triggers, which bypass RLS entirely, so no general
-- INSERT policy is added — a user still can't write into another user's
-- notifications.)
-- ----------------------------------------------------------------------------
drop policy if exists "notifications_update_own" on notifications;
create policy "notifications_update_own" on notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Re-point the 3 existing owner-only triggers through category+data too,
-- so they render through the same localized path as everything below
-- instead of being the only rows stuck on raw English title/message.
-- ----------------------------------------------------------------------------
create or replace function notify_owners_new_business_claim() returns trigger as $$
begin
  insert into notifications (user_id, title, message, type, action_url, category, data)
  select id, 'New business claim', new.full_name || ' wants to claim a listing', 'info',
    '/admin/partners', 'business_claim_new', jsonb_build_object('fullName', new.full_name)
  from profiles where role = 'owner';
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create or replace function notify_owners_new_contact_message() returns trigger as $$
begin
  insert into notifications (user_id, title, message, type, action_url, category, data)
  select id, 'New contact message', new.name || ': ' || left(new.message, 80), 'info',
    '/admin', 'contact_message_new', jsonb_build_object('name', new.name, 'messagePreview', left(new.message, 80))
  from profiles where role = 'owner';
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create or replace function notify_owners_new_join_request() returns trigger as $$
begin
  insert into notifications (user_id, title, message, type, action_url, category, data)
  select id, 'New business join request', new.business_name || ' wants to join Go Hargeisa', 'info',
    '/admin/requests', 'join_request_new', jsonb_build_object('businessName', new.business_name)
  from profiles where role = 'owner';
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- ----------------------------------------------------------------------------
-- PARTNER REQUEST APPROVED / REJECTED — business_join_requests carries only
-- an email (anonymous application, no account required to apply). profiles
-- has no email column of its own (that lives on auth.users, 1:1 via id) —
-- if that email happens to match a registered account, they get notified;
-- otherwise there's no account to attach an in-app notification to (they
-- were already told by email, out of scope of this table).
-- ----------------------------------------------------------------------------
create or replace function notify_applicant_join_request_decided() returns trigger as $$
begin
  if new.status not in ('approved', 'rejected') or old.status is not distinct from new.status then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  select u.id,
    case when new.status = 'approved' then 'Partner request approved' else 'Partner request rejected' end,
    new.business_name || ' — ' || new.status::text,
    case when new.status = 'approved' then 'success' else 'error' end,
    '/dashboard',
    case when new.status = 'approved' then 'join_request_approved' else 'join_request_rejected' end,
    jsonb_build_object('businessName', new.business_name)
  from auth.users u where lower(u.email) = lower(new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public, auth, pg_temp;

drop trigger if exists trg_notify_join_request_decided on business_join_requests;
create trigger trg_notify_join_request_decided
  after update of status on business_join_requests
  for each row execute procedure notify_applicant_join_request_decided();

-- ----------------------------------------------------------------------------
-- NEW BOOKING — notifies the hotel's owner. Fires on every insert
-- regardless of code path (guest RPC or owner-entered), matching how
-- set_booking_reference already behaves.
-- ----------------------------------------------------------------------------
create or replace function notify_owner_new_booking() returns trigger as $$
declare
  v_owner_id uuid;
  v_hotel_name text;
  v_hotel_slug text;
begin
  select owner_id, name, slug into v_owner_id, v_hotel_name, v_hotel_slug from hotels where id = new.hotel_id;
  if v_owner_id is null then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  values (
    v_owner_id, 'New booking request', new.guest_name || ' — ' || coalesce(v_hotel_name, ''), 'info',
    '/business/bookings', 'booking_new',
    jsonb_build_object(
      'listingName', v_hotel_name, 'listingSlug', v_hotel_slug, 'guestName', new.guest_name,
      'checkIn', new.check_in, 'checkOut', new.check_out, 'bookingReference', new.booking_reference
    )
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_booking on bookings;
create trigger trg_notify_new_booking
  after insert on bookings
  for each row execute procedure notify_owner_new_booking();

-- ----------------------------------------------------------------------------
-- BOOKING STATUS UPDATE — notifies the guest, only when they booked while
-- signed in (bookings.user_id is nullable — anonymous guests have no
-- account to notify in-app).
-- ----------------------------------------------------------------------------
create or replace function notify_guest_booking_status() returns trigger as $$
declare
  v_hotel_name text;
  v_hotel_slug text;
begin
  if new.user_id is null or old.status is not distinct from new.status then
    return new;
  end if;

  select name, slug into v_hotel_name, v_hotel_slug from hotels where id = new.hotel_id;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  values (
    new.user_id, 'Booking ' || new.status::text, coalesce(v_hotel_name, '') || ' — ' || new.status::text,
    case new.status when 'confirmed' then 'success' when 'completed' then 'success' when 'cancelled' then 'error' else 'info' end,
    '/dashboard?tab=bookings', 'booking_status',
    jsonb_build_object(
      'listingName', v_hotel_name, 'listingSlug', v_hotel_slug, 'status', new.status,
      'checkIn', new.check_in, 'checkOut', new.check_out, 'bookingReference', new.booking_reference
    )
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_booking_status on bookings;
create trigger trg_notify_booking_status
  after update of status on bookings
  for each row execute procedure notify_guest_booking_status();

-- ----------------------------------------------------------------------------
-- NEW REVIEW — notifies the listing's business owner. Attractions have no
-- owner_id (city-run), so they're silently skipped by the null check.
-- ----------------------------------------------------------------------------
create or replace function notify_owner_new_review() returns trigger as $$
declare
  v_owner_id uuid;
  v_name text;
  v_slug text;
begin
  if new.listing_type = 'hotel' then
    select owner_id, name, slug into v_owner_id, v_name, v_slug from hotels where id = new.listing_id;
  elsif new.listing_type = 'restaurant' then
    select owner_id, name, slug into v_owner_id, v_name, v_slug from restaurants where id = new.listing_id;
  elsif new.listing_type = 'cafe' then
    select owner_id, name, slug into v_owner_id, v_name, v_slug from cafes where id = new.listing_id;
  elsif new.listing_type = 'service' then
    select owner_id, name, slug into v_owner_id, v_name, v_slug from services where id = new.listing_id;
  else
    return new;
  end if;

  if v_owner_id is null then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  values (
    v_owner_id, 'New review', coalesce(v_name, '') || ' — ' || new.rating::text || ' stars', 'info',
    '/business/reviews', 'review_new',
    jsonb_build_object('listingName', v_name, 'listingSlug', v_slug, 'listingType', new.listing_type, 'rating', new.rating)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_review on reviews;
create trigger trg_notify_new_review
  after insert on reviews
  for each row execute procedure notify_owner_new_review();

-- ----------------------------------------------------------------------------
-- OFFER APPROVED / REJECTED — notifies the offer's owner once an admin
-- moderates it (lib/actions/offers.ts moderateOffer).
-- ----------------------------------------------------------------------------
create or replace function notify_owner_offer_moderated() returns trigger as $$
declare
  v_owner_id uuid;
  v_name text;
begin
  if new.approval_status not in ('approved', 'rejected') or old.approval_status is not distinct from new.approval_status then
    return new;
  end if;

  if new.listing_type = 'hotel' then
    select owner_id, name into v_owner_id, v_name from hotels where id = new.listing_id;
  elsif new.listing_type = 'restaurant' then
    select owner_id, name into v_owner_id, v_name from restaurants where id = new.listing_id;
  elsif new.listing_type = 'cafe' then
    select owner_id, name into v_owner_id, v_name from cafes where id = new.listing_id;
  else
    return new;
  end if;

  if v_owner_id is null then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  values (
    v_owner_id,
    case when new.approval_status = 'approved' then 'Offer approved' else 'Offer rejected' end,
    new.title || ' — ' || new.approval_status::text,
    case when new.approval_status = 'approved' then 'success' else 'error' end,
    '/business/offers',
    case when new.approval_status = 'approved' then 'offer_approved' else 'offer_rejected' end,
    jsonb_build_object('offerTitle', new.title, 'listingName', v_name)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_offer_moderated on business_offers;
create trigger trg_notify_offer_moderated
  after update of approval_status on business_offers
  for each row execute procedure notify_owner_offer_moderated();

-- ----------------------------------------------------------------------------
-- NEW MESSAGE — notifies the listing's business owner of a new guest
-- contact-form message.
-- ----------------------------------------------------------------------------
create or replace function notify_owner_new_message() returns trigger as $$
declare
  v_owner_id uuid;
  v_name text;
  v_slug text;
begin
  if new.listing_type = 'hotel' then
    select owner_id, name, slug into v_owner_id, v_name, v_slug from hotels where id = new.listing_id;
  elsif new.listing_type = 'restaurant' then
    select owner_id, name, slug into v_owner_id, v_name, v_slug from restaurants where id = new.listing_id;
  elsif new.listing_type = 'cafe' then
    select owner_id, name, slug into v_owner_id, v_name, v_slug from cafes where id = new.listing_id;
  elsif new.listing_type = 'service' then
    select owner_id, name, slug into v_owner_id, v_name, v_slug from services where id = new.listing_id;
  else
    return new;
  end if;

  if v_owner_id is null then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  values (
    v_owner_id, 'New message', new.sender_name || ' — ' || left(new.message, 80), 'info',
    '/business/messages', 'message_new',
    jsonb_build_object('listingName', v_name, 'listingSlug', v_slug, 'listingType', new.listing_type, 'senderName', new.sender_name)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_message on business_messages;
create trigger trg_notify_new_message
  after insert on business_messages
  for each row execute procedure notify_owner_new_message();
