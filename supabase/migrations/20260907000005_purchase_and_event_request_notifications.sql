-- ============================================================================
-- Go Hargeisa — Purchase/Event request notifications
--
-- Same SECURITY DEFINER trigger pattern as notify_owner_new_booking() /
-- notify_guest_booking_status() (20260801000005) — bypasses RLS so the
-- insert works regardless of who triggered the parent row, category+data
-- jsonb for localized client-side rendering (lib/utils/notification-text.ts),
-- delivered through the existing Realtime notification bell — no new
-- notification infrastructure.
-- Purely additive, safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- purchase_requests
-- ----------------------------------------------------------------------------

create or replace function notify_owner_new_purchase_request() returns trigger as $$
declare
  v_owner_id uuid;
  v_name text;
  v_slug text;
begin
  if new.listing_type <> 'city_service' then
    return new;
  end if;

  select owner_id, name, slug into v_owner_id, v_name, v_slug from city_services where id = new.listing_id;
  if v_owner_id is null then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  values (
    v_owner_id, 'New purchase request', new.customer_name || ' — ' || new.product_name, 'info',
    '/business/requests', 'purchase_request_new',
    jsonb_build_object('listingName', v_name, 'listingSlug', v_slug, 'customerName', new.customer_name, 'productName', new.product_name, 'requestId', new.id)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_purchase_request on purchase_requests;
create trigger trg_notify_new_purchase_request
  after insert on purchase_requests
  for each row execute procedure notify_owner_new_purchase_request();

create or replace function notify_customer_purchase_request_status() returns trigger as $$
declare
  v_name text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  select name into v_name from city_services where id = new.listing_id;

  if new.status = 'quote_ready' then
    insert into notifications (user_id, title, message, type, action_url, category, data)
    values (
      new.user_id, 'Your quote is ready', coalesce(v_name, '') || ' — ' || new.product_name, 'success',
      '/dashboard/requests/' || new.id, 'purchase_request_quote_ready',
      jsonb_build_object('listingName', v_name, 'productName', new.product_name, 'requestId', new.id, 'quotedTotal', new.quoted_total)
    );
  elsif new.status in ('ordered', 'shipped', 'in_transit', 'ready_for_delivery', 'completed', 'cancelled', 'rejected') then
    insert into notifications (user_id, title, message, type, action_url, category, data)
    values (
      new.user_id, 'Order request ' || new.status, coalesce(v_name, '') || ' — ' || new.product_name,
      case new.status when 'completed' then 'success' when 'cancelled' then 'error' when 'rejected' then 'error' else 'info' end,
      '/dashboard/requests/' || new.id, 'purchase_request_status',
      jsonb_build_object('listingName', v_name, 'productName', new.product_name, 'requestId', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_purchase_request_status on purchase_requests;
create trigger trg_notify_purchase_request_status
  after update of status on purchase_requests
  for each row execute procedure notify_customer_purchase_request_status();

create or replace function notify_owner_purchase_request_response() returns trigger as $$
declare
  v_owner_id uuid;
  v_name text;
begin
  if old.status is not distinct from new.status or new.status not in ('approved', 'declined') then
    return new;
  end if;

  select owner_id, name into v_owner_id, v_name from city_services where id = new.listing_id;
  if v_owner_id is null then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  values (
    v_owner_id,
    case when new.status = 'approved' then 'Quote approved' else 'Quote declined' end,
    new.customer_name || ' — ' || new.product_name,
    case when new.status = 'approved' then 'success' else 'error' end,
    '/business/requests', 'purchase_request_customer_response',
    jsonb_build_object('listingName', v_name, 'customerName', new.customer_name, 'productName', new.product_name, 'requestId', new.id, 'status', new.status)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_purchase_request_response on purchase_requests;
create trigger trg_notify_purchase_request_response
  after update of status on purchase_requests
  for each row execute procedure notify_owner_purchase_request_response();

-- ----------------------------------------------------------------------------
-- event_requests
-- ----------------------------------------------------------------------------

create or replace function notify_owner_new_event_request() returns trigger as $$
declare
  v_owner_id uuid;
  v_name text;
  v_slug text;
begin
  if new.listing_type <> 'city_service' then
    return new;
  end if;

  select owner_id, name, slug into v_owner_id, v_name, v_slug from city_services where id = new.listing_id;
  if v_owner_id is null then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  values (
    v_owner_id, 'New event request', new.customer_name || ' — ' || new.event_type, 'info',
    '/business/events', 'event_request_new',
    jsonb_build_object('listingName', v_name, 'listingSlug', v_slug, 'customerName', new.customer_name, 'eventType', new.event_type, 'requestId', new.id)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_event_request on event_requests;
create trigger trg_notify_new_event_request
  after insert on event_requests
  for each row execute procedure notify_owner_new_event_request();

create or replace function notify_customer_event_request_status() returns trigger as $$
declare
  v_name text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  select name into v_name from city_services where id = new.listing_id;

  if new.status = 'proposal_sent' then
    insert into notifications (user_id, title, message, type, action_url, category, data)
    values (
      new.user_id, 'Your event proposal is ready', coalesce(v_name, '') || ' — ' || new.event_type, 'success',
      '/dashboard/events/' || new.id, 'event_request_proposal_sent',
      jsonb_build_object('listingName', v_name, 'eventType', new.event_type, 'requestId', new.id, 'proposalCost', new.proposal_cost)
    );
  elsif new.status in ('planning', 'completed', 'cancelled') then
    insert into notifications (user_id, title, message, type, action_url, category, data)
    values (
      new.user_id, 'Event request ' || new.status, coalesce(v_name, '') || ' — ' || new.event_type,
      case new.status when 'completed' then 'success' when 'cancelled' then 'error' else 'info' end,
      '/dashboard/events/' || new.id, 'event_request_status',
      jsonb_build_object('listingName', v_name, 'eventType', new.event_type, 'requestId', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_event_request_status on event_requests;
create trigger trg_notify_event_request_status
  after update of status on event_requests
  for each row execute procedure notify_customer_event_request_status();

create or replace function notify_owner_event_request_response() returns trigger as $$
declare
  v_owner_id uuid;
  v_name text;
begin
  if old.status is not distinct from new.status or new.status not in ('approved', 'declined') then
    return new;
  end if;

  select owner_id, name into v_owner_id, v_name from city_services where id = new.listing_id;
  if v_owner_id is null then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  values (
    v_owner_id,
    case when new.status = 'approved' then 'Event proposal approved' else 'Event proposal declined' end,
    new.customer_name || ' — ' || new.event_type,
    case when new.status = 'approved' then 'success' else 'error' end,
    '/business/events', 'event_request_customer_response',
    jsonb_build_object('listingName', v_name, 'customerName', new.customer_name, 'eventType', new.event_type, 'requestId', new.id, 'status', new.status)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_event_request_response on event_requests;
create trigger trg_notify_event_request_response
  after update of status on event_requests
  for each row execute procedure notify_owner_event_request_response();
