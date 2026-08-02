-- ============================================================================
-- Go Hargeisa — Notifications System: repair + preferences + gating + new
-- event types + performance indexes.
--
-- REPAIR SECTION (parts 1-2 below): 20260801000004_offers_moderation.sql and
-- 20260801000005_notifications_system.sql are both marked "applied" in this
-- project's migration history table, but direct queries against the live
-- database show none of their DDL actually took effect — business_offers is
-- still missing discount_type/discount_value/coupon_code/cover_image/
-- approval_status/featured, and notifications is still missing category/
-- data. Net effect: offer creation has been failing outright (createOffer
-- writes to columns that don't exist), and none of the 9 event-driven
-- notification triggers from 000005 exist at all (confirmed via
-- information_schema.triggers — only the 3 older, pre-existing admin
-- triggers from 20260730000004 are present). Both source files are fully
-- idempotent (IF NOT EXISTS / OR REPLACE / DROP...IF EXISTS throughout), so
-- re-running them verbatim here is safe regardless of how much of each
-- actually landed before.
--
-- NEW WORK (parts 3+): profile-level notification preferences
-- (notify_in_app + notify_categories, alongside the existing notify_activity/
-- notify_marketing email toggles), a should_notify_in_app() gate wired into
-- every trigger (existing and new — additive only, defaults to "on" so
-- behavior for any user who hasn't touched Settings is unchanged), 5 new
-- event triggers (review reply, promotion for favoriters, new event,
-- account verified, system announcement), and the composite indexes the
-- paginated notification list / unread-count queries need.
-- Safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART 1 — repair: 20260801000004_offers_moderation.sql, verbatim.
-- ----------------------------------------------------------------------------
alter table business_offers drop column if exists discount_label;

do $$ begin
  create type offer_discount_type as enum ('percentage', 'fixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type offer_approval_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

alter table business_offers add column if not exists discount_type offer_discount_type not null default 'percentage';
alter table business_offers add column if not exists discount_value numeric;
alter table business_offers add column if not exists coupon_code text;
alter table business_offers add column if not exists cover_image text;
alter table business_offers add column if not exists approval_status offer_approval_status not null default 'pending';
alter table business_offers add column if not exists featured boolean not null default false;

create index if not exists idx_business_offers_approval on business_offers (approval_status, is_active);

drop policy if exists "Public reads active offers for published listings" on business_offers;
create policy "Public reads approved offers for published listings" on business_offers for select
  using (
    is_active = true
    and approval_status = 'approved'
    and (
      (listing_type = 'hotel' and exists (select 1 from hotels h where h.id = listing_id and h.status = 'published'))
      or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = listing_id and r.status = 'published'))
      or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = listing_id and c.status = 'published'))
    )
  );

-- ----------------------------------------------------------------------------
-- PART 2 — repair: 20260801000005_notifications_system.sql structural
-- pieces this file doesn't already redefine below (columns, RLS policy, and
-- the 6 explicit CREATE TRIGGER bindings — the function bodies themselves
-- are superseded by Part 3's gated versions, so they aren't repeated here).
-- ----------------------------------------------------------------------------
alter table notifications add column if not exists category text;
alter table notifications add column if not exists data jsonb not null default '{}'::jsonb;

create index if not exists idx_notifications_category on notifications(category);

drop policy if exists "notifications_update_own" on notifications;
create policy "notifications_update_own" on notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Placeholder bodies just to give CREATE TRIGGER something to bind to —
-- Part 3 immediately replaces every one of these via CREATE OR REPLACE
-- FUNCTION (same name/signature = same OID = trigger binding survives).
create or replace function notify_applicant_join_request_decided() returns trigger as $$
begin return new; end;
$$ language plpgsql security definer set search_path = public, auth, pg_temp;

drop trigger if exists trg_notify_join_request_decided on business_join_requests;
create trigger trg_notify_join_request_decided
  after update of status on business_join_requests
  for each row execute procedure notify_applicant_join_request_decided();

create or replace function notify_owner_new_booking() returns trigger as $$
begin return new; end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_booking on bookings;
create trigger trg_notify_new_booking
  after insert on bookings
  for each row execute procedure notify_owner_new_booking();

create or replace function notify_guest_booking_status() returns trigger as $$
begin return new; end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_booking_status on bookings;
create trigger trg_notify_booking_status
  after update of status on bookings
  for each row execute procedure notify_guest_booking_status();

create or replace function notify_owner_new_review() returns trigger as $$
begin return new; end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_review on reviews;
create trigger trg_notify_new_review
  after insert on reviews
  for each row execute procedure notify_owner_new_review();

create or replace function notify_owner_offer_moderated() returns trigger as $$
begin return new; end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_offer_moderated on business_offers;
create trigger trg_notify_offer_moderated
  after update of approval_status on business_offers
  for each row execute procedure notify_owner_offer_moderated();

create or replace function notify_owner_new_message() returns trigger as $$
begin return new; end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_message on business_messages;
create trigger trg_notify_new_message
  after insert on business_messages
  for each row execute procedure notify_owner_new_message();

-- ----------------------------------------------------------------------------
-- PART 3 — new: preferences, gating, and every trigger's real (final)
-- function body.
-- ----------------------------------------------------------------------------
alter table profiles add column if not exists notify_in_app boolean not null default true;
alter table profiles add column if not exists notify_categories jsonb not null default '{}'::jsonb;

create index if not exists idx_notifications_user_created on notifications(user_id, created_at desc);
create index if not exists idx_notifications_user_unread on notifications(user_id, is_read) where is_read = false;

-- should_notify_in_app(user, group) — group is one of the checkbox keys
-- exposed in Settings ('booking' | 'review' | 'promotion' | 'event' |
-- 'announcement'). Any other group (e.g. 'admin', 'verification',
-- 'message') has no per-category UI, so it's governed only by the
-- notify_in_app master switch. Missing profile row / null preference
-- always resolves to "notify" — never silently drops a notification for a
-- user who has no row yet.
create or replace function should_notify_in_app(p_user_id uuid, p_group text) returns boolean as $$
declare
  v_in_app boolean;
  v_group_pref boolean;
begin
  select notify_in_app, (notify_categories ->> p_group)::boolean into v_in_app, v_group_pref
  from profiles where id = p_user_id;

  if v_in_app is null then return true; end if;
  if v_in_app = false then return false; end if;
  if v_group_pref = false then return false; end if;
  return true;
end;
$$ language plpgsql stable security definer set search_path = public, pg_temp;

create or replace function notify_owners_new_business_claim() returns trigger as $$
begin
  insert into notifications (user_id, title, message, type, action_url, category, data)
  select id, 'New business claim', new.full_name || ' wants to claim a listing', 'info',
    '/admin/partners', 'business_claim_new', jsonb_build_object('fullName', new.full_name)
  from profiles where role = 'owner' and should_notify_in_app(id, 'admin');
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create or replace function notify_owners_new_contact_message() returns trigger as $$
begin
  insert into notifications (user_id, title, message, type, action_url, category, data)
  select id, 'New contact message', new.name || ': ' || left(new.message, 80), 'info',
    '/admin', 'contact_message_new', jsonb_build_object('name', new.name, 'messagePreview', left(new.message, 80))
  from profiles where role = 'owner' and should_notify_in_app(id, 'admin');
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create or replace function notify_owners_new_join_request() returns trigger as $$
begin
  insert into notifications (user_id, title, message, type, action_url, category, data)
  select id, 'New business join request', new.business_name || ' wants to join Go Hargeisa', 'info',
    '/admin/requests', 'join_request_new', jsonb_build_object('businessName', new.business_name)
  from profiles where role = 'owner' and should_notify_in_app(id, 'admin');
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

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
  from auth.users u where lower(u.email) = lower(new.email) and should_notify_in_app(u.id, 'verification');
  return new;
end;
$$ language plpgsql security definer set search_path = public, auth, pg_temp;

create or replace function notify_owner_new_booking() returns trigger as $$
declare
  v_owner_id uuid;
  v_hotel_name text;
  v_hotel_slug text;
begin
  select owner_id, name, slug into v_owner_id, v_hotel_name, v_hotel_slug from hotels where id = new.hotel_id;
  if v_owner_id is null or not should_notify_in_app(v_owner_id, 'booking') then
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

create or replace function notify_guest_booking_status() returns trigger as $$
declare
  v_hotel_name text;
  v_hotel_slug text;
begin
  if new.user_id is null or old.status is not distinct from new.status or not should_notify_in_app(new.user_id, 'booking') then
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

  if v_owner_id is null or not should_notify_in_app(v_owner_id, 'review') then
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

  if v_owner_id is null or not should_notify_in_app(v_owner_id, 'promotion') then
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

  if v_owner_id is null or not should_notify_in_app(v_owner_id, 'message') then
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

-- NEW: REVIEW REPLY — notifies the review's author the first time (and any
-- later time) the business owner writes/changes a reply.
create or replace function notify_review_author_owner_reply() returns trigger as $$
declare
  v_name text;
  v_slug text;
  v_href_segment text;
begin
  if new.owner_reply is null or old.owner_reply is not distinct from new.owner_reply
     or not should_notify_in_app(new.user_id, 'review') then
    return new;
  end if;

  if new.listing_type = 'hotel' then
    select name, slug into v_name, v_slug from hotels where id = new.listing_id; v_href_segment := 'hotels';
  elsif new.listing_type = 'restaurant' then
    select name, slug into v_name, v_slug from restaurants where id = new.listing_id; v_href_segment := 'restaurants';
  elsif new.listing_type = 'cafe' then
    select name, slug into v_name, v_slug from cafes where id = new.listing_id; v_href_segment := 'cafes';
  elsif new.listing_type = 'attraction' then
    select name, slug into v_name, v_slug from attractions where id = new.listing_id; v_href_segment := 'attractions';
  else
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  values (
    new.user_id, 'New reply to your review', coalesce(v_name, '') || ' replied to your review', 'info',
    case when v_slug is not null then '/' || v_href_segment || '/' || v_slug else null end,
    'review_reply',
    jsonb_build_object('listingName', v_name, 'listingSlug', v_slug, 'listingType', new.listing_type)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_review_reply on reviews;
create trigger trg_notify_review_reply
  after update of owner_reply on reviews
  for each row execute procedure notify_review_author_owner_reply();

-- NEW: NEW PROMOTION FROM A FAVORITE BUSINESS — when an offer is approved,
-- notify every user who has favorited that hotel/restaurant/cafe. Separate
-- from notify_owner_offer_moderated above (that one tells the owner their
-- own submission was approved; this tells guests who favorited the place).
create or replace function notify_favoriters_new_promotion() returns trigger as $$
declare
  v_name text;
  v_slug text;
  v_href_segment text;
begin
  if new.approval_status <> 'approved' or old.approval_status is not distinct from new.approval_status then
    return new;
  end if;

  if new.listing_type = 'hotel' then
    select name, slug into v_name, v_slug from hotels where id = new.listing_id; v_href_segment := 'hotels';
  elsif new.listing_type = 'restaurant' then
    select name, slug into v_name, v_slug from restaurants where id = new.listing_id; v_href_segment := 'restaurants';
  elsif new.listing_type = 'cafe' then
    select name, slug into v_name, v_slug from cafes where id = new.listing_id; v_href_segment := 'cafes';
  else
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  select f.user_id, 'New promotion', coalesce(v_name, '') || ' — ' || new.title, 'info',
    '/' || v_href_segment || '/' || v_slug, 'promotion_new',
    jsonb_build_object('offerTitle', new.title, 'listingName', v_name, 'listingSlug', v_slug)
  from favorites f
  where f.listing_type = new.listing_type and f.listing_id = new.listing_id
    and should_notify_in_app(f.user_id, 'promotion');
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_favoriters_new_promotion on business_offers;
create trigger trg_notify_favoriters_new_promotion
  after update of approval_status on business_offers
  for each row execute procedure notify_favoriters_new_promotion();

-- NEW: NEW EVENT PUBLISHED — broadcast to every user, mirroring the
-- existing admin-broadcast triggers' "select id from profiles" shape.
-- Fires on insert-as-published (the table's default) or a later
-- draft->published transition.
create or replace function notify_all_users_new_event() returns trigger as $$
begin
  if new.status <> 'published' or (tg_op = 'UPDATE' and old.status is not distinct from new.status) then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  select id, 'New event', new.title, 'info', '/explore/' || new.slug, 'event_published',
    jsonb_build_object('eventTitle', new.title, 'eventSlug', new.slug)
  from profiles where should_notify_in_app(id, 'event');
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_event on events;
create trigger trg_notify_new_event
  after insert or update of status on events
  for each row execute procedure notify_all_users_new_event();

-- NEW: ACCOUNT VERIFICATION APPROVED — a listing's partner_status moving
-- trial -> official (lib/actions/partners.ts setPartnerStatus) is this
-- app's "account verification" event. One function, reused across the
-- three partner tables (all share owner_id/name/slug columns).
create or replace function notify_owner_account_verified() returns trigger as $$
begin
  if new.owner_id is null or not should_notify_in_app(new.owner_id, 'verification') then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  values (
    new.owner_id, 'Account verified', coalesce(new.name, '') || ' is now an official partner', 'success',
    '/business', 'account_verified', jsonb_build_object('listingName', new.name)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_hotel_verified on hotels;
create trigger trg_notify_hotel_verified
  after update of partner_status on hotels
  for each row when (old.partner_status = 'trial' and new.partner_status = 'official')
  execute procedure notify_owner_account_verified();

drop trigger if exists trg_notify_restaurant_verified on restaurants;
create trigger trg_notify_restaurant_verified
  after update of partner_status on restaurants
  for each row when (old.partner_status = 'trial' and new.partner_status = 'official')
  execute procedure notify_owner_account_verified();

drop trigger if exists trg_notify_cafe_verified on cafes;
create trigger trg_notify_cafe_verified
  after update of partner_status on cafes
  for each row when (old.partner_status = 'trial' and new.partner_status = 'official')
  execute procedure notify_owner_account_verified();

-- NEW: SYSTEM ANNOUNCEMENTS — broadcast when an admin publishes a site
-- announcement (lib/actions/announcements.ts setAnnouncementStatus).
create or replace function notify_all_users_new_announcement() returns trigger as $$
begin
  if new.status <> 'published' or old.status is not distinct from new.status then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  select id, new.title, new.message, 'info', coalesce(new.link_url, '/'), 'system_announcement',
    jsonb_build_object('announcementTitle', new.title, 'announcementMessage', new.message)
  from profiles where should_notify_in_app(id, 'announcement');
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_announcement on site_announcements;
create trigger trg_notify_new_announcement
  after update of status on site_announcements
  for each row execute procedure notify_all_users_new_announcement();

-- ----------------------------------------------------------------------------
-- PART 4 — drop the temporary introspection helper from
-- 20260802000002_diag_temp.sql (used once to diagnose the above, not needed
-- going forward).
-- ----------------------------------------------------------------------------
drop function if exists diag_list_triggers(text[]);
