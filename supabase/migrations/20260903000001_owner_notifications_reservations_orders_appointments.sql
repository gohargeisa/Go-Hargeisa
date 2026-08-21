-- ============================================================================
-- Go Hargeisa — Business Owner Notifications for Table Reservations, Product
-- Orders, and Appointments
--
-- NOT APPLIED ANYWHERE YET — written for review, matching this session's
-- established pattern. Do not apply without explicit sign-off.
--
-- WHY THIS EXISTS
--   The owner-notification system (notifications table, should_notify_in_app,
--   the notify_owner_new_* trigger family) already exists and is LIVE in
--   production for hotels.bookings, reviews, business_offers, and
--   business_messages (see 20260801000005_notifications_system.sql /
--   20260802000003_notifications_complete.sql). table_reservations,
--   product_orders, and appointments were all added in LATER migrations and
--   never got the equivalent trigger — a restaurant/cafe reservation, a
--   product order (cafe/restaurant/service/city_service), or a salon/clinic
--   appointment currently notifies no one. This migration is purely
--   additive, following the exact same established pattern (security
--   definer trigger function, should_notify_in_app gating, insert into the
--   existing `notifications` table) — no new notification system, no new
--   table, no new RLS policy (notifications' own RLS already restricts
--   every row to its own user_id, so ownership isolation is automatic).
--
-- OWNER RESOLUTION
--   table_reservations/product_orders are polymorphic (listing_type +
--   listing_id across hotels/restaurants/cafes/services/city_services) —
--   each trigger resolves owner_id with the same per-type CASE branching
--   already used by this project's own RLS policies on these tables.
--   appointments resolves through doctors.city_service_id -> city_services
--   .owner_id, the same join used by appointments' own existing RLS.
--
-- SAFETY
--   Purely additive: 3 new trigger functions + 3 new triggers on existing
--   tables. No existing table, column, or RLS policy touched.
-- ============================================================================

create or replace function notify_owner_new_table_reservation() returns trigger as $$
declare
  v_owner_id uuid;
  v_listing_name text;
begin
  if new.listing_type = 'restaurant' then
    select owner_id, name into v_owner_id, v_listing_name from restaurants where id = new.listing_id;
  elsif new.listing_type = 'cafe' then
    select owner_id, name into v_owner_id, v_listing_name from cafes where id = new.listing_id;
  elsif new.listing_type = 'service' then
    select owner_id, name into v_owner_id, v_listing_name from services where id = new.listing_id;
  end if;

  if v_owner_id is null or not should_notify_in_app(v_owner_id, 'booking') then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  values (
    v_owner_id, 'New reservation request', new.customer_name || ' — ' || coalesce(v_listing_name, ''), 'info',
    '/business/reservations', 'reservation_new',
    jsonb_build_object(
      'listingName', v_listing_name, 'customerName', new.customer_name,
      'reservationDate', new.reservation_date, 'reservationTime', new.reservation_time,
      'reservationReference', new.reservation_reference
    )
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_table_reservation on table_reservations;
create trigger trg_notify_new_table_reservation
  after insert on table_reservations
  for each row execute function notify_owner_new_table_reservation();

create or replace function notify_owner_new_product_order() returns trigger as $$
declare
  v_owner_id uuid;
  v_listing_name text;
begin
  if new.listing_type = 'restaurant' then
    select owner_id, name into v_owner_id, v_listing_name from restaurants where id = new.listing_id;
  elsif new.listing_type = 'cafe' then
    select owner_id, name into v_owner_id, v_listing_name from cafes where id = new.listing_id;
  elsif new.listing_type = 'service' then
    select owner_id, name into v_owner_id, v_listing_name from services where id = new.listing_id;
  elsif new.listing_type = 'city_service' then
    select owner_id, name into v_owner_id, v_listing_name from city_services where id = new.listing_id;
  end if;

  if v_owner_id is null or not should_notify_in_app(v_owner_id, 'order') then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  values (
    v_owner_id, 'New order', new.customer_name || ' — ' || coalesce(v_listing_name, ''), 'info',
    '/business/orders', 'order_new',
    jsonb_build_object(
      'listingName', v_listing_name, 'customerName', new.customer_name, 'orderReference', new.order_reference
    )
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_product_order on product_orders;
create trigger trg_notify_new_product_order
  after insert on product_orders
  for each row execute function notify_owner_new_product_order();

create or replace function notify_owner_new_appointment() returns trigger as $$
declare
  v_owner_id uuid;
  v_listing_name text;
begin
  select cs.owner_id, cs.name into v_owner_id, v_listing_name
  from doctors d join city_services cs on cs.id = d.city_service_id
  where d.id = new.doctor_id;

  if v_owner_id is null or not should_notify_in_app(v_owner_id, 'appointment') then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  values (
    v_owner_id, 'New appointment request', new.patient_name || ' — ' || coalesce(v_listing_name, ''), 'info',
    '/business/appointments', 'appointment_new',
    jsonb_build_object(
      'listingName', v_listing_name, 'patientName', new.patient_name,
      'appointmentDate', new.appointment_date, 'appointmentTime', new.appointment_time
    )
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_appointment on appointments;
create trigger trg_notify_new_appointment
  after insert on appointments
  for each row execute function notify_owner_new_appointment();
