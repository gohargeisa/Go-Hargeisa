-- ============================================================================
-- Go Hargeisa — Café product/flower support + real commerce fields on
-- product_orders + Perfumes as its own top-level nav category
--
-- Written and reviewed as a single migration (the products/product_orders
-- engine already exists for Perfume Shops / Flower Shops under
-- city_services/services — see 20260810000001_products_engine.sql,
-- 20260814000004_flowers_gifts_products.sql,
-- 20260818000002_universal_video_pdf_products_bookings.sql — this widens it
-- to also serve a Café that sells a secondary line of products, e.g.
-- Lavender: Café primary, flowers secondary, without a second business
-- listing or a parallel ordering system).
--
-- `cafes` has no `category_id` (cafes/hotels/restaurants are fixed
-- verticals, not category-table-driven), so eligibility is gated on a plain
-- per-listing boolean instead of categories.supports_products.
--
-- Purely additive. Nothing existing is dropped, renamed, or destructively
-- changed. Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Cafe product/flower support
-- ---------------------------------------------------------------------------
alter table cafes add column if not exists sells_flowers boolean not null default false;
alter table cafes add column if not exists flower_addons jsonb not null default '[]';
alter table cafes add column if not exists products_delivery_enabled boolean not null default false;

-- ---------------------------------------------------------------------------
-- 2. Widen `products` RLS to recognize listing_type = 'cafe'
-- ---------------------------------------------------------------------------
drop policy if exists "Public can read visible products of published listings" on products;
create policy "Public can read visible products of published listings" on products
  for select
  using (
    is_hidden = false
    and (
      (listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = products.listing_id and cs.status = 'published'))
      or (listing_type = 'service' and exists (select 1 from services s where s.id = products.listing_id and s.status = 'published'))
      or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = products.listing_id and c.status = 'published' and c.sells_flowers = true))
    )
  );

drop policy if exists "Owners manage their own products" on products;
create policy "Owners manage their own products" on products
  for all
  using (
    (listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = products.listing_id and cs.owner_id = auth.uid()))
    or (listing_type = 'service' and exists (select 1 from services s where s.id = products.listing_id and s.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = products.listing_id and c.owner_id = auth.uid()))
  )
  with check (
    (listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = products.listing_id and cs.owner_id = auth.uid()))
    or (listing_type = 'service' and exists (select 1 from services s where s.id = products.listing_id and s.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = products.listing_id and c.owner_id = auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- 3. product_orders: real commerce fields (quantity, unit price, add-ons
--    snapshot + total, grand total) it never had — every previous order was
--    a single-item, price-unaware request. Nullable-safe: every existing
--    row/caller that never sends these keeps working exactly as before.
-- ---------------------------------------------------------------------------
alter table product_orders add column if not exists quantity integer not null default 1;
alter table product_orders drop constraint if exists product_orders_quantity_check;
alter table product_orders add constraint product_orders_quantity_check check (quantity between 1 and 20);
alter table product_orders add column if not exists unit_price numeric(10, 2);
alter table product_orders add column if not exists addons jsonb not null default '[]';
alter table product_orders add column if not exists addons_total numeric(10, 2) not null default 0;
alter table product_orders add column if not exists total numeric(10, 2);

alter table product_orders drop constraint if exists product_orders_listing_type_check;
alter table product_orders add constraint product_orders_listing_type_check check (listing_type in ('city_service', 'service', 'cafe'));

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
      select 1 from cafes c where c.id = listing_id and c.status = 'published' and c.sells_flowers = true
    ))
  );

-- ---------------------------------------------------------------------------
-- 4. submit_product_order RPC — widened signature (quantity, add-ons) +
--    server-side pricing (never trusts a client-supplied price) + server-side
--    delivery enforcement (silently downgrades to pickup if the listing
--    doesn't offer delivery, rather than trusting a hidden-but-spoofable
--    client field). Single caller (lib/actions/product-orders.ts) updated in
--    lockstep, so the old 13-arg overload is dropped rather than kept
--    alongside a second one — exactly one submit_product_order exists after
--    this migration.
-- ---------------------------------------------------------------------------
drop function if exists public.submit_product_order(text, uuid, uuid, text, text, text, text, date, text, text, text, text, text);

create or replace function public.submit_product_order(
  p_listing_type text,
  p_listing_id uuid,
  p_product_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_quantity integer,
  p_addon_ids uuid[],
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
  v_delivery_enabled boolean;
  v_quantity integer := greatest(1, least(20, coalesce(p_quantity, 1)));
  v_fulfillment text;
  v_unit_price numeric(10, 2);
  v_addons jsonb;
  v_addons_total numeric(10, 2);
  v_total numeric(10, 2);
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
  if p_listing_type not in ('city_service', 'service', 'cafe') then
    raise exception 'Invalid listing type';
  end if;

  if p_listing_type = 'city_service' then
    select exists(
      select 1 from city_services cs join categories c on c.id = cs.category_id
      where cs.id = p_listing_id and cs.status = 'published' and c.supports_products = true
    ), coalesce(cs.products_delivery_enabled, true)
    into v_eligible, v_delivery_enabled
    from city_services cs where cs.id = p_listing_id;
  elsif p_listing_type = 'service' then
    select exists(
      select 1 from services s join categories c on c.id = s.category_id
      where s.id = p_listing_id and s.status = 'published' and c.supports_products = true
    ), coalesce(s.products_delivery_enabled, true)
    into v_eligible, v_delivery_enabled
    from services s where s.id = p_listing_id;
  else
    select exists(
      select 1 from cafes c where c.id = p_listing_id and c.status = 'published' and c.sells_flowers = true
    ), coalesce(c.products_delivery_enabled, false)
    into v_eligible, v_delivery_enabled
    from cafes c where c.id = p_listing_id;
  end if;

  if not coalesce(v_eligible, false) then
    raise exception 'Product orders are not available for this listing';
  end if;

  v_fulfillment := case when p_fulfillment_type = 'delivery' and coalesce(v_delivery_enabled, false) then 'delivery' else 'pickup' end;
  if v_fulfillment = 'delivery' and (p_delivery_address is null or btrim(p_delivery_address) = '') then
    raise exception 'Delivery address is required for delivery orders';
  end if;

  if p_product_id is not null then
    if not exists (
      select 1 from products where id = p_product_id and listing_type = p_listing_type and listing_id = p_listing_id
    ) then
      raise exception 'Product does not belong to this listing';
    end if;
    select price into v_unit_price from products where id = p_product_id;
  end if;

  if p_addon_ids is not null and array_length(p_addon_ids, 1) > 0 then
    if p_listing_type = 'cafe' then
      select
        coalesce(jsonb_agg(jsonb_build_object('id', a.addon ->> 'id', 'name', a.addon ->> 'name', 'price', (a.addon ->> 'price')::numeric)), '[]'::jsonb),
        coalesce(sum((a.addon ->> 'price')::numeric), 0)
      into v_addons, v_addons_total
      from cafes c
      cross join lateral jsonb_array_elements(c.flower_addons) as a(addon)
      where c.id = p_listing_id and (a.addon ->> 'id')::uuid = any (p_addon_ids);
    else
      v_addons := '[]';
      v_addons_total := 0;
    end if;
  else
    v_addons := '[]';
    v_addons_total := 0;
  end if;

  v_total := (coalesce(v_unit_price, 0) * v_quantity) + coalesce(v_addons_total, 0);

  insert into product_orders (
    listing_type, listing_id, product_id, customer_name, customer_phone,
    quantity, unit_price, addons, addons_total, total,
    fulfillment_type, delivery_address, preferred_date, recipient_name, recipient_phone,
    occasion, message_note, notes, status, user_id
  ) values (
    p_listing_type, p_listing_id, p_product_id, btrim(p_customer_name), btrim(p_customer_phone),
    v_quantity, v_unit_price, v_addons, coalesce(v_addons_total, 0), v_total,
    v_fulfillment, nullif(btrim(coalesce(p_delivery_address, '')), ''), p_preferred_date,
    nullif(btrim(coalesce(p_recipient_name, '')), ''), nullif(btrim(coalesce(p_recipient_phone, '')), ''),
    nullif(btrim(coalesce(p_occasion, '')), ''), nullif(btrim(coalesce(p_message_note, '')), ''),
    nullif(btrim(coalesce(p_notes, '')), ''), 'pending', auth.uid()
  )
  returning order_reference into v_reference;

  return v_reference;
end;
$$;

revoke all on function public.submit_product_order(text, uuid, uuid, text, text, integer, uuid[], text, text, date, text, text, text, text, text) from public;
grant execute on function public.submit_product_order(text, uuid, uuid, text, text, integer, uuid[], text, text, date, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Perfumes: promote to a pinned top-level nav category — the same
--    mechanism that already makes Hotels/Restaurants/Cafes/Attractions/
--    Events/City Services their own top-level entries (categories rows with
--    is_pinned = true). No new table, no new category tier.
-- ---------------------------------------------------------------------------
update categories set is_pinned = true where slug = 'perfume-shop';

-- ---------------------------------------------------------------------------
-- 6. Same additive enum-gap fix as the already-live flower_shops one
--    (20260821000001_fix_flower_shops_enum_value.sql), for 3 more
--    categories that hit the identical bug today: legacyCategoryEnum()
--    (lib/actions/city-services.ts) derives the legacy city_services.category
--    enum value directly from categories.slug (hyphens -> underscores), but
--    these three never got a matching enum value added. Only ADDING values
--    here (not using them). Safe to re-run.
-- ---------------------------------------------------------------------------
alter type city_service_category add value if not exists 'institute';
alter type city_service_category add value if not exists 'language_institute';
alter type city_service_category add value if not exists 'quran_memorization_center';
