-- ============================================================================
-- Go Hargeisa — Universal Business Capabilities System
--
-- Four independent, additive pieces, all reusing existing architecture
-- rather than duplicating it:
--
-- 1. PDF/document capability, generalized beyond Restaurant/Cafe's existing
--    `menu_pdf_url`. Rather than renaming that column (which would be a
--    breaking change to two working, populated columns), this adds a
--    same-shape `document_url` column to the three listing tables that have
--    no PDF concept at all yet. Every public surface picks a
--    category-appropriate label for whichever column is actually present —
--    see lib/utils/business-document.ts — so this is one reusable feature,
--    not five different ones.
--
-- 2. Products catalog category vocabulary widened for Flower Shops — the
--    existing `products` table/RLS/dashboard (ProductsManager,
--    business/products) already works generically for any
--    supports_products=true category (Perfume & Cosmetics, Auto Repair,
--    Flower Shops today); only its `category` CHECK constraint was scoped to
--    perfume/cosmetics vocabulary. Purely additive — no existing value is
--    removed or renamed, so every existing product row keeps validating.
--
-- 3. Real Estate property-viewing requests, reusing `table_reservations`
--    (already a generic listing_type/listing_id request table) instead of a
--    third near-identical booking table. 'service' was added to
--    listing_type_business in the prior migration; this widens
--    table_reservations' RLS policies and submit_table_reservation() RPC to
--    accept it, gated on the listing's category being 'real-estate' (Real
--    Estate has no owner-togglable `reservable` column the way
--    restaurants/cafes do — every published Real Estate listing can receive
--    a viewing request, the same way every published Hospital/Clinic can
--    receive an appointment request once it has real doctor rows). The
--    'restaurant'/'cafe' branches are untouched — existing reservations are
--    unaffected.
--
-- 4. Product orders/requests — a new table, because Flower Shop orders
--    genuinely need fields (recipient, occasion, delivery address, card
--    message) that don't fit table_reservations or the appointments engine.
--    Generic over listing_type (city_service/service) and product_id
--    (optional — a customer can request without picking a specific catalog
--    item), so it serves Perfume Shops identically without a second table.
--    Mirrors table_reservations' exact reference-trigger + RLS + SECURITY
--    DEFINER RPC pattern.
--
-- Safe to re-run (if-not-exists / drop-if-exists / create-or-replace
-- throughout). Nothing existing is deleted, renamed, or destructively
-- changed.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Universal PDF/document column
-- ---------------------------------------------------------------------------
alter table hotels add column if not exists document_url text;
alter table city_services add column if not exists document_url text;
alter table services add column if not exists document_url text;

-- ---------------------------------------------------------------------------
-- 2. Products category vocabulary — Flower Shops
-- ---------------------------------------------------------------------------
alter table products drop constraint if exists products_category_check;
alter table products add constraint products_category_check check (category in (
  'perfume', 'oud', 'bakhoor', 'attar', 'body_mist', 'cosmetics', 'makeup',
  'body_care', 'hair_care', 'gift_sets', 'accessories',
  'skincare_creams', 'hair_extensions_wigs', 'perfumes_fragrances', 'bath_body',
  'nail_care', 'beauty_tools_accessories', 'womens_personal_care',
  'spare_parts',
  'bouquet', 'floral_arrangement', 'occasion_gift', 'plant', 'cake'
));

-- ---------------------------------------------------------------------------
-- 3. Real Estate property viewings, via table_reservations
-- ---------------------------------------------------------------------------
drop policy if exists "Business owners manage their listing reservations" on table_reservations;
create policy "Business owners manage their listing reservations" on table_reservations for all
  using (
    (listing_type = 'restaurant' and exists (
      select 1 from restaurants r join profiles p on p.id = auth.uid()
      where r.id = listing_id and r.owner_id = auth.uid() and p.role = 'business_owner'
    ))
    or (listing_type = 'cafe' and exists (
      select 1 from cafes c join profiles p on p.id = auth.uid()
      where c.id = listing_id and c.owner_id = auth.uid() and p.role = 'business_owner'
    ))
    or (listing_type = 'service' and exists (
      select 1 from services s join profiles p on p.id = auth.uid()
      where s.id = listing_id and s.owner_id = auth.uid() and p.role = 'business_owner'
    ))
  )
  with check (
    (listing_type = 'restaurant' and exists (
      select 1 from restaurants r join profiles p on p.id = auth.uid()
      where r.id = listing_id and r.owner_id = auth.uid() and p.role = 'business_owner'
    ))
    or (listing_type = 'cafe' and exists (
      select 1 from cafes c join profiles p on p.id = auth.uid()
      where c.id = listing_id and c.owner_id = auth.uid() and p.role = 'business_owner'
    ))
    or (listing_type = 'service' and exists (
      select 1 from services s join profiles p on p.id = auth.uid()
      where s.id = listing_id and s.owner_id = auth.uid() and p.role = 'business_owner'
    ))
  );

drop policy if exists "Anyone can request a reservation for an eligible listing" on table_reservations;
create policy "Anyone can request a reservation for an eligible listing" on table_reservations
  for insert with check (
    (listing_type = 'restaurant' and exists (
      select 1 from restaurants r where r.id = listing_id and r.status = 'published' and r.reservable = true
    ))
    or (listing_type = 'cafe' and exists (
      select 1 from cafes c where c.id = listing_id and c.status = 'published' and c.reservable = true
    ))
    or (listing_type = 'service' and exists (
      select 1 from services s join categories c on c.id = s.category_id
      where s.id = listing_id and s.status = 'published' and c.slug = 'real-estate'
    ))
  );

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
  if coalesce(p_guests_count, 0) < 1 or p_guests_count > 50 then
    raise exception 'Guest count must be between 1 and 50';
  end if;
  if p_listing_type not in ('restaurant', 'cafe', 'service') then
    raise exception 'Reservations are only available for restaurants, cafes, and real estate viewings';
  end if;

  if p_listing_type = 'restaurant' then
    select exists(
      select 1 from restaurants where id = p_listing_id and status = 'published' and reservable = true
    ) into v_eligible;
  elsif p_listing_type = 'cafe' then
    select exists(
      select 1 from cafes where id = p_listing_id and status = 'published' and reservable = true
    ) into v_eligible;
  else
    select exists(
      select 1 from services s join categories c on c.id = s.category_id
      where s.id = p_listing_id and s.status = 'published' and c.slug = 'real-estate'
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

revoke all on function public.submit_table_reservation(listing_type_business, uuid, text, text, date, time, integer, text) from public;
grant execute on function public.submit_table_reservation(listing_type_business, uuid, text, text, date, time, integer, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Product orders/requests (Flower Shops, Perfume Shops, and any future
--    supports_products category)
-- ---------------------------------------------------------------------------
create table if not exists product_orders (
  id uuid primary key default gen_random_uuid(),
  listing_type text not null check (listing_type in ('city_service', 'service')),
  listing_id uuid not null,
  product_id uuid references products(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  fulfillment_type text not null default 'pickup' check (fulfillment_type in ('delivery', 'pickup')),
  delivery_address text,
  preferred_date date,
  recipient_name text,
  recipient_phone text,
  occasion text,
  message_note text,
  notes text,
  status booking_status not null default 'pending',
  order_reference text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_orders_listing
  on product_orders (listing_type, listing_id, created_at desc);

create sequence if not exists product_order_reference_seq start with 1;

create or replace function set_product_order_reference() returns trigger as $$
begin
  if new.order_reference is null or btrim(new.order_reference) = '' then
    new.order_reference := 'ORD-' || extract(year from now())::text || '-' ||
      lpad(nextval('product_order_reference_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_product_order_reference on product_orders;
create trigger trg_set_product_order_reference
  before insert on product_orders
  for each row execute procedure set_product_order_reference();

alter table product_orders enable row level security;

drop policy if exists "Owners manage all product orders" on product_orders;
create policy "Owners manage all product orders" on product_orders for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

drop policy if exists "Business owners manage their listing product orders" on product_orders;
create policy "Business owners manage their listing product orders" on product_orders for all
  using (
    (listing_type = 'city_service' and exists (
      select 1 from city_services cs join profiles p on p.id = auth.uid()
      where cs.id = listing_id and cs.owner_id = auth.uid() and p.role = 'business_owner'
    ))
    or (listing_type = 'service' and exists (
      select 1 from services s join profiles p on p.id = auth.uid()
      where s.id = listing_id and s.owner_id = auth.uid() and p.role = 'business_owner'
    ))
  )
  with check (
    (listing_type = 'city_service' and exists (
      select 1 from city_services cs join profiles p on p.id = auth.uid()
      where cs.id = listing_id and cs.owner_id = auth.uid() and p.role = 'business_owner'
    ))
    or (listing_type = 'service' and exists (
      select 1 from services s join profiles p on p.id = auth.uid()
      where s.id = listing_id and s.owner_id = auth.uid() and p.role = 'business_owner'
    ))
  );

drop policy if exists "Anyone can request a product order for an eligible listing" on product_orders;
create policy "Anyone can request a product order for an eligible listing" on product_orders
  for insert with check (
    (listing_type = 'city_service' and exists (
      select 1 from city_services cs join categories c on c.id = cs.category_id
      where cs.id = listing_id and cs.status = 'published' and c.supports_products = true
    ))
    or (listing_type = 'service' and exists (
      select 1 from services s join categories c on c.id = s.category_id
      where s.id = listing_id and s.status = 'published' and c.supports_products = true
    ))
  );

drop policy if exists "Customers view their own product orders" on product_orders;
create policy "Customers view their own product orders" on product_orders for select
  using (user_id = auth.uid());

create or replace function public.submit_product_order(
  p_listing_type text,
  p_listing_id uuid,
  p_product_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_fulfillment_type text,
  p_delivery_address text,
  p_preferred_date date,
  p_recipient_name text,
  p_recipient_phone text,
  p_occasion text,
  p_message_note text,
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
  if p_fulfillment_type not in ('delivery', 'pickup') then
    raise exception 'Invalid fulfillment type';
  end if;
  if p_fulfillment_type = 'delivery' and (p_delivery_address is null or btrim(p_delivery_address) = '') then
    raise exception 'Delivery address is required for delivery orders';
  end if;
  if p_listing_type not in ('city_service', 'service') then
    raise exception 'Invalid listing type';
  end if;

  if p_listing_type = 'city_service' then
    select exists(
      select 1 from city_services cs join categories c on c.id = cs.category_id
      where cs.id = p_listing_id and cs.status = 'published' and c.supports_products = true
    ) into v_eligible;
  else
    select exists(
      select 1 from services s join categories c on c.id = s.category_id
      where s.id = p_listing_id and s.status = 'published' and c.supports_products = true
    ) into v_eligible;
  end if;

  if not v_eligible then
    raise exception 'Product orders are not available for this listing';
  end if;

  if p_product_id is not null and not exists (
    select 1 from products where id = p_product_id and listing_type = p_listing_type and listing_id = p_listing_id
  ) then
    raise exception 'Product does not belong to this listing';
  end if;

  insert into product_orders (
    listing_type, listing_id, product_id, customer_name, customer_phone,
    fulfillment_type, delivery_address, preferred_date, recipient_name, recipient_phone,
    occasion, message_note, notes, status, user_id
  ) values (
    p_listing_type, p_listing_id, p_product_id, btrim(p_customer_name), btrim(p_customer_phone),
    p_fulfillment_type, nullif(btrim(coalesce(p_delivery_address, '')), ''), p_preferred_date,
    nullif(btrim(coalesce(p_recipient_name, '')), ''), nullif(btrim(coalesce(p_recipient_phone, '')), ''),
    nullif(btrim(coalesce(p_occasion, '')), ''), nullif(btrim(coalesce(p_message_note, '')), ''),
    nullif(btrim(coalesce(p_notes, '')), ''), 'pending', auth.uid()
  )
  returning order_reference into v_reference;

  return v_reference;
end;
$$;

revoke all on function public.submit_product_order(text, uuid, uuid, text, text, text, text, date, text, text, text, text, text) from public;
grant execute on function public.submit_product_order(text, uuid, uuid, text, text, text, text, date, text, text, text, text, text) to anon, authenticated;
