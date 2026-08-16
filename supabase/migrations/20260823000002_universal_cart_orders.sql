-- ============================================================================
-- Go Hargeisa — Universal Product Ordering System (Cart + Checkout + Orders)
--
-- Generalizes the single-item "request order" engine (products +
-- product_orders, built for Perfume/Cosmetics shops and widened to Flower
-- Shops/Lavender in 20260814000004 / 20260822000001) into a real multi-item
-- cart/checkout system reusable by ANY product-selling business — Restaurant,
-- Cafe, Flower Shop, Perfume Shop, Cosmetics, Fashion, Grocery, Bakery, Gift
-- Shop, and any future vertical — without a second products/orders table per
-- category. Lavender (cafe menu + flowers together) is the first real,
-- multi-vertical test case.
--
-- Run AFTER 20260823000001_universal_orders_enum_widen.sql has committed.
--
-- UPDATED after initial review: submit_cart_order() now also checks the
-- product's own category before ever attaching a cafe's flower_addons
-- pricing to a line item (search "v_is_flower_product" below) — closes a
-- real cross-contamination gap where any cafe product's addon_ids would
-- have resolved against that cafe's flower add-on vocabulary, letting a
-- café drink/food line silently carry flower add-on pricing. The matching
-- client-side fix (lib/cart/product-addons.ts) ships in the same commit as
-- this migration edit, not separately.
--
-- What changes and why:
--
-- 1. `order_items` — new child table. The single biggest gap: product_orders
--    previously had exactly one product_id/quantity/unit_price per row, so a
--    customer could only ever order ONE product per request. A cart holds
--    multiple products from one business; each line becomes one order_items
--    row with its own price/add-ons snapshot (see the note on #2 below for
--    why a snapshot, not a live FK price lookup, matters).
--
-- 2. `product_orders` becomes the order HEADER (customer, fulfillment,
--    status, subtotal/total, timestamps) instead of a single-item row.
--    product_id/quantity/unit_price/addons/addons_total move to order_items;
--    dropped here since 0 rows currently reference them (verified live) —
--    no backfill/migration-of-data needed. `restaurant` is added to the
--    listing_type check (the 4th and last product-selling listing table).
--
-- 3. `ordering_enabled` — one uniform, owner-togglable boolean gate added to
--    `cafes` and `restaurants` (city_service/service already have the
--    equivalent per-category gate: categories.supports_products). Replaces
--    `cafes.sells_flowers` as the RLS/RPC eligibility gate — sells_flowers
--    stays exactly where it is (unchanged column, unchanged meaning: "this
--    cafe has a flower product line"), it just stops being the thing RLS
--    checks. Backfilled true for every cafe that already had sells_flowers
--    true, so Lavender's flower ordering keeps working with zero downtime.
--
-- 4. `products.category` CHECK constraint is DROPPED (free text from here
--    on). A fixed enum needs a migration edit for every new vertical
--    (Perfume added its own values, then Flower Shops added more in
--    20260818000002) — the opposite of "the same system works for every
--    future product business" this system exists to deliver. Every existing
--    value keeps validating; nothing is renamed or removed.
--
-- 5. `submit_product_order` (single-item) is replaced by `submit_cart_order`
--    (accepts a jsonb array of {product_id, quantity, addon_ids} — one whole
--    cart in one call). Same server-side-pricing/eligibility-check shape as
--    its predecessor (client never sends a price), just looping over N items
--    instead of assuming exactly 1. Single caller (lib/actions/product-
--    orders.ts) updated in lockstep.
--
-- 6. `city_services.products_delivery_enabled` / `services.products_
--    delivery_enabled` — added here. The live submit_product_order RPC
--    already referenced these two columns for its city_service/service
--    branches (20260822000001) but never actually added them, so delivery
--    was silently broken (a runtime "column does not exist" error) for
--    every Perfume/Flower Shop order attempted with fulfillment=delivery.
--    Fixed as a side effect of rebuilding the RPC.
--
-- Purely additive/restructuring of a currently-empty table (product_orders
-- has 0 live rows as of this migration — verified). Nothing published-listing
-- facing changes until the app code that calls the new RPC ships alongside
-- this. Safe to re-run (if-not-exists / drop-if-exists throughout).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. ordering_enabled — cafes + restaurants
-- ---------------------------------------------------------------------------
alter table cafes add column if not exists ordering_enabled boolean not null default false;
update cafes set ordering_enabled = true where sells_flowers = true and ordering_enabled = false;

alter table restaurants add column if not exists ordering_enabled boolean not null default false;
alter table restaurants add column if not exists products_delivery_enabled boolean not null default false;

alter table city_services add column if not exists products_delivery_enabled boolean not null default true;
alter table services add column if not exists products_delivery_enabled boolean not null default true;

-- ---------------------------------------------------------------------------
-- 2. products — free-text category, restaurant listing_type support
-- ---------------------------------------------------------------------------
alter table products drop constraint if exists products_category_check;

drop policy if exists "Public can read visible products of published listings" on products;
create policy "Public can read visible products of published listings" on products
  for select
  using (
    is_hidden = false
    and (
      (listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = products.listing_id and cs.status = 'published'))
      or (listing_type = 'service' and exists (select 1 from services s where s.id = products.listing_id and s.status = 'published'))
      or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = products.listing_id and c.status = 'published' and c.ordering_enabled = true))
      or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = products.listing_id and r.status = 'published' and r.ordering_enabled = true))
    )
  );

drop policy if exists "Owners manage their own products" on products;
create policy "Owners manage their own products" on products
  for all
  using (
    (listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = products.listing_id and cs.owner_id = auth.uid()))
    or (listing_type = 'service' and exists (select 1 from services s where s.id = products.listing_id and s.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = products.listing_id and c.owner_id = auth.uid()))
    or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = products.listing_id and r.owner_id = auth.uid()))
  )
  with check (
    (listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = products.listing_id and cs.owner_id = auth.uid()))
    or (listing_type = 'service' and exists (select 1 from services s where s.id = products.listing_id and s.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = products.listing_id and c.owner_id = auth.uid()))
    or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = products.listing_id and r.owner_id = auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- 3. product_orders — becomes the order header; order_items becomes the
--    line-item table.
-- ---------------------------------------------------------------------------
alter table product_orders drop column if exists product_id;
alter table product_orders drop column if exists quantity;
alter table product_orders drop column if exists unit_price;
alter table product_orders drop column if exists addons;
alter table product_orders drop column if exists addons_total;
alter table product_orders add column if not exists subtotal numeric(10, 2) not null default 0;

alter table product_orders drop constraint if exists product_orders_listing_type_check;
alter table product_orders add constraint product_orders_listing_type_check
  check (listing_type in ('city_service', 'service', 'cafe', 'restaurant'));

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references product_orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  -- Snapshots: an order placed today must keep showing today's name/price
  -- forever, even after the product is renamed, repriced, or deleted.
  product_name text not null,
  product_name_ar text,
  product_name_so text,
  product_image text,
  unit_price numeric(10, 2) not null default 0,
  quantity integer not null default 1 check (quantity between 1 and 20),
  addons jsonb not null default '[]',
  addons_total numeric(10, 2) not null default 0,
  line_total numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order on order_items (order_id);
create index if not exists idx_order_items_product on order_items (product_id);

alter table order_items enable row level security;

-- Visibility mirrors the parent order exactly: the customer who placed it,
-- the owning business, or the platform admin.
drop policy if exists "Order items follow parent order visibility" on order_items;
create policy "Order items follow parent order visibility" on order_items for select
  using (
    exists (
      select 1 from product_orders po
      where po.id = order_items.order_id
      and (
        po.user_id = auth.uid()
        or exists (select 1 from profiles where id = auth.uid() and role = 'owner')
        or (po.listing_type = 'city_service' and exists (
          select 1 from city_services cs join profiles p on p.id = auth.uid()
          where cs.id = po.listing_id and cs.owner_id = auth.uid() and p.role = 'business_owner'
        ))
        or (po.listing_type = 'service' and exists (
          select 1 from services s join profiles p on p.id = auth.uid()
          where s.id = po.listing_id and s.owner_id = auth.uid() and p.role = 'business_owner'
        ))
        or (po.listing_type = 'cafe' and exists (
          select 1 from cafes c join profiles p on p.id = auth.uid()
          where c.id = po.listing_id and c.owner_id = auth.uid() and p.role = 'business_owner'
        ))
        or (po.listing_type = 'restaurant' and exists (
          select 1 from restaurants r join profiles p on p.id = auth.uid()
          where r.id = po.listing_id and r.owner_id = auth.uid() and p.role = 'business_owner'
        ))
      )
    )
  );

-- All writes happen through submit_cart_order() (SECURITY DEFINER, below) —
-- no direct-insert policy needed; direct table writes stay default-denied.

-- ---------------------------------------------------------------------------
-- 4. product_orders RLS — widen to restaurant, same shape otherwise
-- ---------------------------------------------------------------------------
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
    or (listing_type = 'cafe' and exists (
      select 1 from cafes c join profiles p on p.id = auth.uid()
      where c.id = listing_id and c.owner_id = auth.uid() and p.role = 'business_owner'
    ))
    or (listing_type = 'restaurant' and exists (
      select 1 from restaurants r join profiles p on p.id = auth.uid()
      where r.id = listing_id and r.owner_id = auth.uid() and p.role = 'business_owner'
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
    or (listing_type = 'cafe' and exists (
      select 1 from cafes c join profiles p on p.id = auth.uid()
      where c.id = listing_id and c.owner_id = auth.uid() and p.role = 'business_owner'
    ))
    or (listing_type = 'restaurant' and exists (
      select 1 from restaurants r join profiles p on p.id = auth.uid()
      where r.id = listing_id and r.owner_id = auth.uid() and p.role = 'business_owner'
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
    or (listing_type = 'cafe' and exists (
      select 1 from cafes c where c.id = listing_id and c.status = 'published' and c.ordering_enabled = true
    ))
    or (listing_type = 'restaurant' and exists (
      select 1 from restaurants r where r.id = listing_id and r.status = 'published' and r.ordering_enabled = true
    ))
  );

-- ---------------------------------------------------------------------------
-- 5. submit_cart_order — one whole cart (N products from one business) in
--    one call. Replaces submit_product_order (dropped: its 13-arg signature
--    inserted into columns product_orders no longer has).
-- ---------------------------------------------------------------------------
drop function if exists public.submit_product_order(text, uuid, uuid, text, text, integer, uuid[], text, text, date, text, text, text, text, text);

create or replace function public.submit_cart_order(
  p_listing_type text,
  p_listing_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_fulfillment_type text,
  p_delivery_address text,
  p_preferred_date date,
  p_recipient_name text,
  p_recipient_phone text,
  p_occasion text,
  p_message_note text,
  p_notes text,
  p_items jsonb -- [{ "product_id": uuid, "quantity": int, "addon_ids": uuid[] }, ...]
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reference text;
  v_order_id uuid;
  v_eligible boolean;
  v_delivery_enabled boolean;
  v_fulfillment text;
  v_subtotal numeric(10, 2) := 0;
  v_item jsonb;
  v_product record;
  v_quantity integer;
  v_addon_ids uuid[];
  v_addons jsonb;
  v_addons_total numeric(10, 2);
  v_line_total numeric(10, 2);
  v_is_flower_product boolean;
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
  if p_listing_type not in ('city_service', 'service', 'cafe', 'restaurant') then
    raise exception 'Invalid listing type';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Too many items in one order';
  end if;

  if p_listing_type = 'city_service' then
    select
      exists(
        select 1 from city_services cs join categories c on c.id = cs.category_id
        where cs.id = p_listing_id and cs.status = 'published' and c.supports_products = true
      ),
      coalesce((select cs.products_delivery_enabled from city_services cs where cs.id = p_listing_id), true)
    into v_eligible, v_delivery_enabled;
  elsif p_listing_type = 'service' then
    select
      exists(
        select 1 from services s join categories c on c.id = s.category_id
        where s.id = p_listing_id and s.status = 'published' and c.supports_products = true
      ),
      coalesce((select s.products_delivery_enabled from services s where s.id = p_listing_id), true)
    into v_eligible, v_delivery_enabled;
  elsif p_listing_type = 'cafe' then
    select
      exists(select 1 from cafes c where c.id = p_listing_id and c.status = 'published' and c.ordering_enabled = true),
      coalesce((select c.products_delivery_enabled from cafes c where c.id = p_listing_id), false)
    into v_eligible, v_delivery_enabled;
  else
    select
      exists(select 1 from restaurants r where r.id = p_listing_id and r.status = 'published' and r.ordering_enabled = true),
      coalesce((select r.products_delivery_enabled from restaurants r where r.id = p_listing_id), false)
    into v_eligible, v_delivery_enabled;
  end if;

  if not coalesce(v_eligible, false) then
    raise exception 'Ordering is not available for this listing';
  end if;

  v_fulfillment := case when p_fulfillment_type = 'delivery' and coalesce(v_delivery_enabled, false) then 'delivery' else 'pickup' end;
  if v_fulfillment = 'delivery' and (p_delivery_address is null or btrim(p_delivery_address) = '') then
    raise exception 'Delivery address is required for delivery orders';
  end if;

  insert into product_orders (
    listing_type, listing_id, customer_name, customer_phone,
    fulfillment_type, delivery_address, preferred_date, recipient_name, recipient_phone,
    occasion, message_note, notes, status, subtotal, total, user_id
  ) values (
    p_listing_type, p_listing_id, btrim(p_customer_name), btrim(p_customer_phone),
    v_fulfillment, nullif(btrim(coalesce(p_delivery_address, '')), ''), p_preferred_date,
    nullif(btrim(coalesce(p_recipient_name, '')), ''), nullif(btrim(coalesce(p_recipient_phone, '')), ''),
    nullif(btrim(coalesce(p_occasion, '')), ''), nullif(btrim(coalesce(p_message_note, '')), ''),
    nullif(btrim(coalesce(p_notes, '')), ''), 'pending', 0, 0, auth.uid()
  )
  returning id, order_reference into v_order_id, v_reference;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select p.id, p.name, p.name_ar, p.name_so, p.image, p.price, p.category
    into v_product
    from products p
    where p.id = nullif(v_item->>'product_id', '')::uuid
      and p.listing_type = p_listing_type
      and p.listing_id = p_listing_id
      and p.is_hidden = false;

    if v_product.id is null then
      raise exception 'One of the selected products is no longer available';
    end if;

    v_quantity := greatest(1, least(20, coalesce((v_item->>'quantity')::integer, 1)));

    select coalesce(array_agg(x.val::uuid), array[]::uuid[])
    into v_addon_ids
    from jsonb_array_elements_text(coalesce(v_item->'addon_ids', '[]'::jsonb)) as x(val);

    -- Add-ons are only ever valid for a product actually in the flower/gift
    -- vocabulary (same list as lib/config/product-categories.ts's
    -- FLOWER_SPECIALTY_CATEGORIES) — a café's own coffee/tea/food/cake menu
    -- items (category is null — see 20260823000002's own products.category
    -- CHECK-constraint-drop rationale) can never carry cafes.flower_addons
    -- pricing, no matter what addon_ids a client sends. This is the
    -- server-side half of the fix; lib/cart/product-addons.ts is the
    -- client-side half (never even offers the checkboxes).
    v_is_flower_product := v_product.category in ('bouquet', 'floral_arrangement', 'occasion_gift', 'plant', 'cake', 'gift_sets');

    if array_length(v_addon_ids, 1) > 0 and p_listing_type = 'cafe' and v_is_flower_product then
      select
        coalesce(jsonb_agg(jsonb_build_object('id', a.addon ->> 'id', 'name', a.addon ->> 'name', 'price', (a.addon ->> 'price')::numeric)), '[]'::jsonb),
        coalesce(sum((a.addon ->> 'price')::numeric), 0)
      into v_addons, v_addons_total
      from cafes c
      cross join lateral jsonb_array_elements(c.flower_addons) as a(addon)
      where c.id = p_listing_id and (a.addon ->> 'id')::uuid = any (v_addon_ids);
    else
      v_addons := '[]';
      v_addons_total := 0;
    end if;

    v_line_total := (coalesce(v_product.price, 0) * v_quantity) + coalesce(v_addons_total, 0);
    v_subtotal := v_subtotal + v_line_total;

    insert into order_items (
      order_id, product_id, product_name, product_name_ar, product_name_so, product_image,
      unit_price, quantity, addons, addons_total, line_total
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.name_ar, v_product.name_so, v_product.image,
      coalesce(v_product.price, 0), v_quantity, v_addons, coalesce(v_addons_total, 0), v_line_total
    );
  end loop;

  update product_orders set subtotal = v_subtotal, total = v_subtotal where id = v_order_id;

  return v_reference;
end;
$$;

revoke all on function public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb) from public;
grant execute on function public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb) to anon, authenticated;
