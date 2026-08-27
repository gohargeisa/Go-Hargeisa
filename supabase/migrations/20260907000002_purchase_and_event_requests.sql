-- ============================================================================
-- Go Hargeisa — Purchase Request & Event Request system
--
-- New domain: "customer submits a request → business manually reviews and
-- returns a priced quote/proposal → customer explicitly approves → status
-- tracked through fulfillment." Nothing existing fits this shape — the
-- products/cart engine (submit_cart_order()) requires a known price at
-- submission time, appointments/table_reservations have no quoting step,
-- and business_messages is an unstructured one-way contact log. Built for
-- the Emaankoo Group partner (global shopping/logistics/events) but kept
-- fully polymorphic (listing_type/listing_id, same pattern as products/
-- reviews/bookings) rather than hardcoded to one partner, so any future
-- business with the same capability flag (see the next migration) gets the
-- same system for free — not a duplicate system per-partner.
--
-- Table shape mirrors table_reservations (20260813000001) for the
-- listing-owner/customer/admin split, and appointment_status_history
-- (20260810000002) for the audit-trail child tables.
--
-- listing_type is plain text (not the listing_type_business enum, which is
-- only hotel|restaurant|cafe) because this only ever targets city_services
-- for now — same reasoning products.listing_type already uses plain text.
--
-- Purely additive, safe to re-run.
-- ============================================================================

create table if not exists purchase_requests (
  id uuid primary key default gen_random_uuid(),
  listing_type text not null,
  listing_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  product_name text not null,
  product_url text,
  platform text not null check (platform in ('shein', 'amazon', 'noon', 'iherb', 'alibaba', 'other')),
  quantity integer not null default 1,
  size text,
  color text,
  variant text,
  delivery_location text not null,
  notes text,
  image_url text,
  status text not null default 'pending' check (status in (
    'pending', 'reviewing', 'quote_ready', 'approved', 'declined',
    'ordered', 'shipped', 'in_transit', 'ready_for_delivery', 'completed',
    'cancelled', 'rejected'
  )),
  -- Manual quote, entered by the business once they've actually checked the
  -- product/shipping/customs cost — never computed automatically (product
  -- price, shipping, and customs vary too much to guess).
  quoted_product_cost numeric(10, 2),
  quoted_shipping_cost numeric(10, 2),
  quoted_customs_fee numeric(10, 2),
  quoted_service_fee numeric(10, 2),
  quoted_total numeric(10, 2),
  quote_expires_at timestamptz,
  -- Two separate columns, not one, so an internal note can never leak to
  -- the customer through a shared field.
  partner_notes_customer text,
  partner_notes_internal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_purchase_requests_listing on purchase_requests (listing_type, listing_id, created_at desc);
create index if not exists idx_purchase_requests_user on purchase_requests (user_id, created_at desc);

create table if not exists purchase_request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references purchase_requests(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_purchase_request_status_history_request on purchase_request_status_history (request_id, created_at);

create table if not exists event_requests (
  id uuid primary key default gen_random_uuid(),
  listing_type text not null,
  listing_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  event_type text not null check (event_type in ('family', 'school', 'festival', 'entertainment', 'social', 'other')),
  event_date date,
  event_location text,
  guest_count integer,
  budget_range text,
  services_required text,
  notes text,
  image_url text,
  status text not null default 'new' check (status in (
    'new', 'reviewing', 'proposal_sent', 'approved', 'declined', 'planning', 'completed', 'cancelled'
  )),
  proposal_details text,
  proposal_cost numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_event_requests_listing on event_requests (listing_type, listing_id, created_at desc);
create index if not exists idx_event_requests_user on event_requests (user_id, created_at desc);

create table if not exists event_request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references event_requests(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_request_status_history_request on event_request_status_history (request_id, created_at);

alter table purchase_requests enable row level security;
alter table purchase_request_status_history enable row level security;
alter table event_requests enable row level security;
alter table event_request_status_history enable row level security;

-- ----------------------------------------------------------------------------
-- purchase_requests
-- ----------------------------------------------------------------------------

drop policy if exists "Admins manage all purchase requests" on purchase_requests;
create policy "Admins manage all purchase requests" on purchase_requests for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

drop policy if exists "Business owners manage their listing purchase requests" on purchase_requests;
create policy "Business owners manage their listing purchase requests" on purchase_requests for all
  using (
    listing_type = 'city_service' and exists (
      select 1 from city_services cs join profiles p on p.id = auth.uid()
      where cs.id = listing_id and cs.owner_id = auth.uid() and p.role = 'business_owner'
    )
  )
  with check (
    listing_type = 'city_service' and exists (
      select 1 from city_services cs join profiles p on p.id = auth.uid()
      where cs.id = listing_id and cs.owner_id = auth.uid() and p.role = 'business_owner'
    )
  );

drop policy if exists "Customers create their own purchase requests" on purchase_requests;
create policy "Customers create their own purchase requests" on purchase_requests for insert
  with check (
    user_id = auth.uid()
    and listing_type = 'city_service'
    and exists (
      select 1 from city_services cs join categories c on c.id = cs.category_id
      where cs.id = listing_id and cs.status = 'published' and c.supports_purchase_requests = true
    )
  );

drop policy if exists "Customers view their own purchase requests" on purchase_requests;
create policy "Customers view their own purchase requests" on purchase_requests for select
  using (user_id = auth.uid());

-- Customers may only ever flip a ready quote to approved/declined — never
-- edit anything else. RLS alone can gate WHETHER a row updates, not WHICH
-- columns changed within that update, so the actual column lockdown is the
-- trigger below (same "RLS decides who, a trigger decides what" split
-- enforce_partner_status_owner_only() already uses elsewhere).
drop policy if exists "Customers respond to their own ready quotes" on purchase_requests;
create policy "Customers respond to their own ready quotes" on purchase_requests for update
  using (user_id = auth.uid() and status = 'quote_ready')
  with check (user_id = auth.uid() and status in ('approved', 'declined'));

create or replace function enforce_purchase_request_customer_update() returns trigger as $$
declare
  v_is_privileged boolean;
begin
  select
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
    or exists (
      select 1 from city_services cs join profiles p on p.id = auth.uid()
      where cs.id = new.listing_id and cs.owner_id = auth.uid() and p.role = 'business_owner'
    )
  into v_is_privileged;

  if v_is_privileged then
    return new;
  end if;

  if old.status <> 'quote_ready' or new.status not in ('approved', 'declined') then
    raise exception 'Not authorized to make this change.';
  end if;

  new.customer_name := old.customer_name;
  new.customer_phone := old.customer_phone;
  new.product_name := old.product_name;
  new.product_url := old.product_url;
  new.platform := old.platform;
  new.quantity := old.quantity;
  new.size := old.size;
  new.color := old.color;
  new.variant := old.variant;
  new.delivery_location := old.delivery_location;
  new.notes := old.notes;
  new.image_url := old.image_url;
  new.quoted_product_cost := old.quoted_product_cost;
  new.quoted_shipping_cost := old.quoted_shipping_cost;
  new.quoted_customs_fee := old.quoted_customs_fee;
  new.quoted_service_fee := old.quoted_service_fee;
  new.quoted_total := old.quoted_total;
  new.quote_expires_at := old.quote_expires_at;
  new.partner_notes_customer := old.partner_notes_customer;
  new.partner_notes_internal := old.partner_notes_internal;
  new.listing_type := old.listing_type;
  new.listing_id := old.listing_id;
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_enforce_purchase_request_customer_update on purchase_requests;
create trigger trg_enforce_purchase_request_customer_update
  before update on purchase_requests
  for each row execute procedure enforce_purchase_request_customer_update();

-- ----------------------------------------------------------------------------
-- purchase_request_status_history — readable by whoever can read the parent
-- row; only ever written by server actions running as the owner/admin.
-- ----------------------------------------------------------------------------

drop policy if exists "Admins manage all purchase request history" on purchase_request_status_history;
create policy "Admins manage all purchase request history" on purchase_request_status_history for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

drop policy if exists "Business owners manage their listing purchase request history" on purchase_request_status_history;
create policy "Business owners manage their listing purchase request history" on purchase_request_status_history for all
  using (
    exists (
      select 1 from purchase_requests pr join city_services cs on cs.id = pr.listing_id
      join profiles p on p.id = auth.uid()
      where pr.id = request_id and pr.listing_type = 'city_service' and cs.owner_id = auth.uid() and p.role = 'business_owner'
    )
  )
  with check (
    exists (
      select 1 from purchase_requests pr join city_services cs on cs.id = pr.listing_id
      join profiles p on p.id = auth.uid()
      where pr.id = request_id and pr.listing_type = 'city_service' and cs.owner_id = auth.uid() and p.role = 'business_owner'
    )
  );

drop policy if exists "Customers view their own purchase request history" on purchase_request_status_history;
create policy "Customers view their own purchase request history" on purchase_request_status_history for select
  using (exists (select 1 from purchase_requests pr where pr.id = request_id and pr.user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- event_requests — same shape as purchase_requests, including the
-- customer-approval trigger (spec: "Customer Approved" is a real status the
-- customer themselves flips to, same as quote approval above).
-- ----------------------------------------------------------------------------

drop policy if exists "Admins manage all event requests" on event_requests;
create policy "Admins manage all event requests" on event_requests for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

drop policy if exists "Business owners manage their listing event requests" on event_requests;
create policy "Business owners manage their listing event requests" on event_requests for all
  using (
    listing_type = 'city_service' and exists (
      select 1 from city_services cs join profiles p on p.id = auth.uid()
      where cs.id = listing_id and cs.owner_id = auth.uid() and p.role = 'business_owner'
    )
  )
  with check (
    listing_type = 'city_service' and exists (
      select 1 from city_services cs join profiles p on p.id = auth.uid()
      where cs.id = listing_id and cs.owner_id = auth.uid() and p.role = 'business_owner'
    )
  );

drop policy if exists "Customers create their own event requests" on event_requests;
create policy "Customers create their own event requests" on event_requests for insert
  with check (
    user_id = auth.uid()
    and listing_type = 'city_service'
    and exists (
      select 1 from city_services cs join categories c on c.id = cs.category_id
      where cs.id = listing_id and cs.status = 'published' and c.supports_event_requests = true
    )
  );

drop policy if exists "Customers view their own event requests" on event_requests;
create policy "Customers view their own event requests" on event_requests for select
  using (user_id = auth.uid());

drop policy if exists "Customers respond to their own sent proposals" on event_requests;
create policy "Customers respond to their own sent proposals" on event_requests for update
  using (user_id = auth.uid() and status = 'proposal_sent')
  with check (user_id = auth.uid() and status in ('approved', 'declined'));

create or replace function enforce_event_request_customer_update() returns trigger as $$
declare
  v_is_privileged boolean;
begin
  select
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
    or exists (
      select 1 from city_services cs join profiles p on p.id = auth.uid()
      where cs.id = new.listing_id and cs.owner_id = auth.uid() and p.role = 'business_owner'
    )
  into v_is_privileged;

  if v_is_privileged then
    return new;
  end if;

  if old.status <> 'proposal_sent' or new.status not in ('approved', 'declined') then
    raise exception 'Not authorized to make this change.';
  end if;

  new.customer_name := old.customer_name;
  new.customer_phone := old.customer_phone;
  new.event_type := old.event_type;
  new.event_date := old.event_date;
  new.event_location := old.event_location;
  new.guest_count := old.guest_count;
  new.budget_range := old.budget_range;
  new.services_required := old.services_required;
  new.notes := old.notes;
  new.image_url := old.image_url;
  new.proposal_details := old.proposal_details;
  new.proposal_cost := old.proposal_cost;
  new.listing_type := old.listing_type;
  new.listing_id := old.listing_id;
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_enforce_event_request_customer_update on event_requests;
create trigger trg_enforce_event_request_customer_update
  before update on event_requests
  for each row execute procedure enforce_event_request_customer_update();

-- ----------------------------------------------------------------------------
-- event_request_status_history
-- ----------------------------------------------------------------------------

drop policy if exists "Admins manage all event request history" on event_request_status_history;
create policy "Admins manage all event request history" on event_request_status_history for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

drop policy if exists "Business owners manage their listing event request history" on event_request_status_history;
create policy "Business owners manage their listing event request history" on event_request_status_history for all
  using (
    exists (
      select 1 from event_requests er join city_services cs on cs.id = er.listing_id
      join profiles p on p.id = auth.uid()
      where er.id = request_id and er.listing_type = 'city_service' and cs.owner_id = auth.uid() and p.role = 'business_owner'
    )
  )
  with check (
    exists (
      select 1 from event_requests er join city_services cs on cs.id = er.listing_id
      join profiles p on p.id = auth.uid()
      where er.id = request_id and er.listing_type = 'city_service' and cs.owner_id = auth.uid() and p.role = 'business_owner'
    )
  );

drop policy if exists "Customers view their own event request history" on event_request_status_history;
create policy "Customers view their own event request history" on event_request_status_history for select
  using (exists (select 1 from event_requests er where er.id = request_id and er.user_id = auth.uid()));
