-- ============================================================================
-- Go Hargeisa — Fix: submit_cart_order() never checked products.is_available
--
-- CONFIRMED PRODUCTION BUG, found during order-system QA (2026-08-19):
-- the currently-live submit_cart_order() (from
-- 20260823000002_universal_cart_orders.sql) only filters the per-item
-- product lookup on `is_hidden = false` — it never checks `is_available`.
-- A product/menu item a business owner has marked "Unavailable" (sold out)
-- is still fully orderable today: the client-side UI hides its Add-to-Cart
-- button and shows an "Unavailable" badge, but nothing stops a customer
-- from completing checkout with a stale cart line for it (added while it
-- was still available, then the owner marked it unavailable before the
-- customer checked out) — the RPC has always accepted it regardless.
--
-- Fix is a single added condition, `and p.is_available = true`, in the
-- per-item lookup — the exact same check already correctly applied to
-- variants three lines below in the (still-unapplied)
-- 20260825000001_product_variants.sql, just missing here for the base
-- product. Everything else in this function is byte-for-byte identical to
-- the live 20260823000002 version — no other behavior changes.
--
-- NOT YET APPLIED. Per the project owner's standing instruction, no
-- migration is applied without explicit approval — this file is written
-- for review. Once reviewed, `20260825000001_product_variants.sql` will
-- also need the same one-line fix before or when it is applied (see the
-- comment added there) so the gap doesn't return once variants are live.
-- ============================================================================

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
      and p.is_hidden = false
      and p.is_available = true; -- FIX: was missing; see file header

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
