-- ============================================================================
-- Go Hargeisa — Reusable Per-Product Options System
--
-- NOT APPLIED ANYWHERE YET. Written for review per the project owner's
-- explicit request during the Part 1/Part 2 platform audit (2026-08-19):
-- "write migrations but don't apply them." No isolated local/dev Supabase
-- instance is available to test against in this environment — applying this
-- is a decision for the project owner, from their own machine or with
-- explicit sign-off.
--
-- WHY THIS EXISTS
--   The only per-item customization mechanism that exists today is
--   `ProductAddon` (cafes.flower_addons) — a single flat, BUSINESS-wide list,
--   gated by a hardcoded "is this a flower-category product" check duplicated
--   in lib/cart/product-addons.ts and this database's own submit_cart_order()
--   function. It only ever served one vertical (flower add-ons on cafes) and
--   does not generalize: there is no equivalent mechanism for a cake's
--   writing text, a coffee's milk/sugar/temperature, a makeup product's
--   options beyond shade, or a restaurant item's toppings.
--
--   This migration adds a real per-PRODUCT (not per-category) options
--   system: each product declares its own ordered list of options, each with
--   its own type, choices, and price impact. A product with zero
--   product_options rows behaves exactly as it does today — nothing about
--   the existing addon or variant systems is touched, removed, or replaced.
--   Existing flower add-ons keep working through their own mechanism
--   unchanged; new categories (cakes, cafe drinks, restaurant menu items,
--   makeup, retail) use this instead of extending the flower-only addon list.
--
--   Server-side pricing posture is identical to every other mechanism on
--   this table: the client sends only (key, value) pairs — labels and price
--   deltas are ALWAYS resolved from the `product_options`/choices rows here,
--   never trusted from the client. A crafted request cannot invent an option
--   or a price for a product that doesn't declare it.
--
-- Purely additive: one new table + one nullable jsonb column on order_items
-- + submit_cart_order() widened to parse an optional `selected_options` array
-- per cart line (same signature — 14 args, unchanged from 20260825/20260827
-- — the JSON *shape* inside `p_items` grows, not the function's own
-- parameter list). A line with no selected_options behaves exactly as before.
-- Nothing existing is dropped, renamed, or given a new NOT NULL constraint.
-- Idempotent, safe to re-run.
--
-- Depends on 20260825000001_product_variants.sql having been applied first
-- (this file's submit_cart_order() replacement is the variant+idempotency-
-- aware version, further widened here — applying this without that one first
-- would silently drop variant support the same way 20260827 originally did;
-- see that file's header for the full story).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. product_options — one row per configurable option a product exposes
--    (e.g. "Gift Wrap" boolean on a bouquet, "Milk Type" select on a latte,
--    "Cake Message" text on a birthday cake, "Toppings" multiselect on a
--    pizza). Ordered by sort_order; a product can have any number, including
--    zero (the default/current behavior for every product on the platform).
-- ---------------------------------------------------------------------------
create table if not exists product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  -- Machine key the app/RPC match on, e.g. "milk_type" — stable even if the
  -- label is edited/translated later. Unique per product so a client's
  -- {key, value} pair is unambiguous.
  key text not null,
  label text not null,
  label_ar text,
  label_so text,
  -- 'select'/'multiselect' render from `choices`; 'boolean' is a yes/no
  -- toggle priced by `price_delta`; 'text' is free-form (e.g. cake writing);
  -- 'number' is a quantity-style input priced by `price_delta` per unit
  -- (e.g. birthday candles at $0.50 each).
  type text not null check (type in ('select', 'multiselect', 'boolean', 'text', 'number')),
  required boolean not null default false,
  -- Used by 'boolean' (flat add when true) and 'number' (multiplied by the
  -- entered quantity) only — 'select'/'multiselect' price from `choices`
  -- instead, since each choice can have its own price impact.
  price_delta numeric(10, 2) not null default 0,
  -- [{ "value": text, "label": text, "labelAr": text?, "labelSo": text?, "priceDelta": numeric? }, ...]
  choices jsonb not null default '[]'::jsonb,
  placeholder text,
  placeholder_ar text,
  placeholder_so text,
  -- 'text' only — enforced server-side in submit_cart_order().
  max_length integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, key)
);

create index if not exists idx_product_options_product on product_options (product_id);

alter table product_options enable row level security;

-- Same "public can read options of a visible, published product" shape as
-- product_variants' own policy — one hop further through products.
drop policy if exists "Public can read options of visible products" on product_options;
create policy "Public can read options of visible products" on product_options
  for select
  using (
    exists (
      select 1 from products p
      where p.id = product_options.product_id
        and p.is_hidden = false
        and (
          (p.listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = p.listing_id and cs.status = 'published'))
          or (p.listing_type = 'service' and exists (select 1 from services s where s.id = p.listing_id and s.status = 'published'))
          or (p.listing_type = 'cafe' and exists (select 1 from cafes c where c.id = p.listing_id and c.status = 'published'))
          or (p.listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = p.listing_id and r.status = 'published'))
        )
    )
  );

drop policy if exists "Owners manage options of their own products" on product_options;
create policy "Owners manage options of their own products" on product_options
  for all
  using (
    exists (
      select 1 from products p
      where p.id = product_options.product_id
        and (
          (p.listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = p.listing_id and cs.owner_id = auth.uid()))
          or (p.listing_type = 'service' and exists (select 1 from services s where s.id = p.listing_id and s.owner_id = auth.uid()))
          or (p.listing_type = 'cafe' and exists (select 1 from cafes c where c.id = p.listing_id and c.owner_id = auth.uid()))
          or (p.listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = p.listing_id and r.owner_id = auth.uid()))
        )
    )
  )
  with check (
    exists (
      select 1 from products p
      where p.id = product_options.product_id
        and (
          (p.listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = p.listing_id and cs.owner_id = auth.uid()))
          or (p.listing_type = 'service' and exists (select 1 from services s where s.id = p.listing_id and s.owner_id = auth.uid()))
          or (p.listing_type = 'cafe' and exists (select 1 from cafes c where c.id = p.listing_id and c.owner_id = auth.uid()))
          or (p.listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = p.listing_id and r.owner_id = auth.uid()))
        )
    )
  );

drop policy if exists "Platform admin manages all product options" on product_options;
create policy "Platform admin manages all product options" on product_options
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

-- ---------------------------------------------------------------------------
-- 2. order_items — one nullable jsonb column, same "freeze what was actually
--    ordered" pattern as product_name/variant_name/addons already on this
--    table. An order for "Chocolate Cake / Message: Happy Birthday / Candles
--    x5" must keep showing that forever, even if the option is later renamed
--    or removed from the product.
--    Shape: [{ "key", "label", "type", "value", "valueLabel", "priceDelta" }, ...]
-- ---------------------------------------------------------------------------
alter table order_items add column if not exists selected_options jsonb;

-- ---------------------------------------------------------------------------
-- 3. submit_cart_order — same 14-arg signature as the corrected
--    20260825000001 version; only the JSON shape inside p_items grows:
--    [{ product_id, quantity, addon_ids, variant_id?,
--       selected_options?: [{ "key": text, "value": jsonb }] }, ...]
--    Every value/label/price is re-resolved here from product_options, never
--    trusted from the client. A required option missing a value raises an
--    exception (same posture as every other validation in this function).
-- ---------------------------------------------------------------------------
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
  p_items jsonb,
  p_idempotency_key text default null
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
  v_variant record;
  v_variant_id uuid;
  v_quantity integer;
  v_addon_ids uuid[];
  v_addons jsonb;
  v_addons_total numeric(10, 2);
  v_line_total numeric(10, 2);
  v_is_flower_product boolean;
  v_unit_price numeric(10, 2);
  v_item_name text;
  v_item_name_ar text;
  v_item_name_so text;
  v_item_image text;
  v_variant_name text;
  v_variant_sku text;
  v_existing_id uuid;
  v_existing_reference text;
  -- Per-product options resolution
  v_opt record;
  v_opt_value_raw jsonb;
  v_value_text text;
  v_value_num numeric;
  v_choice record;
  v_choice_delta numeric;
  v_choice_label text;
  v_ms_val text;
  v_ms_labels text[];
  v_ms_delta numeric;
  v_selected_options jsonb;
  v_options_total numeric(10, 2);
begin
  -- Idempotency short-circuit — unchanged from 20260825/20260827.
  if p_idempotency_key is not null then
    select id, order_reference into v_existing_id, v_existing_reference
    from product_orders
    where idempotency_key = p_idempotency_key;

    if v_existing_id is not null then
      return v_existing_reference;
    end if;
  end if;

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

  begin
    insert into product_orders (
      listing_type, listing_id, customer_name, customer_phone,
      fulfillment_type, delivery_address, preferred_date, recipient_name, recipient_phone,
      occasion, message_note, notes, status, subtotal, total, user_id, idempotency_key
    ) values (
      p_listing_type, p_listing_id, btrim(p_customer_name), btrim(p_customer_phone),
      v_fulfillment, nullif(btrim(coalesce(p_delivery_address, '')), ''), p_preferred_date,
      nullif(btrim(coalesce(p_recipient_name, '')), ''), nullif(btrim(coalesce(p_recipient_phone, '')), ''),
      nullif(btrim(coalesce(p_occasion, '')), ''), nullif(btrim(coalesce(p_message_note, '')), ''),
      nullif(btrim(coalesce(p_notes, '')), ''), 'pending', 0, 0, auth.uid(), p_idempotency_key
    )
    returning id, order_reference into v_order_id, v_reference;
  exception when unique_violation then
    select id, order_reference into v_existing_id, v_existing_reference
    from product_orders
    where idempotency_key = p_idempotency_key;
    return v_existing_reference;
  end;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select p.id, p.name, p.name_ar, p.name_so, p.image, p.price, p.category
    into v_product
    from products p
    where p.id = nullif(v_item->>'product_id', '')::uuid
      and p.listing_type = p_listing_type
      and p.listing_id = p_listing_id
      and p.is_hidden = false
      and p.is_available = true;

    if v_product.id is null then
      raise exception 'One of the selected products is no longer available';
    end if;

    v_quantity := greatest(1, least(20, coalesce((v_item->>'quantity')::integer, 1)));

    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_variant_name := null;
    v_variant_sku := null;
    v_item_name := v_product.name;
    v_item_name_ar := v_product.name_ar;
    v_item_name_so := v_product.name_so;
    v_item_image := v_product.image;
    v_unit_price := v_product.price;

    if v_variant_id is not null then
      select id, name, image, sku, price, is_available
      into v_variant
      from product_variants
      where id = v_variant_id and product_id = v_product.id;

      if v_variant.id is null then
        raise exception 'Selected shade/variant is no longer available';
      end if;
      if not coalesce(v_variant.is_available, true) then
        raise exception 'Selected shade/variant is out of stock';
      end if;

      v_variant_name := v_variant.name;
      v_variant_sku := v_variant.sku;
      if v_variant.image is not null then v_item_image := v_variant.image; end if;
      if v_variant.price is not null then v_unit_price := v_variant.price; end if;
    end if;

    select coalesce(array_agg(x.val::uuid), array[]::uuid[])
    into v_addon_ids
    from jsonb_array_elements_text(coalesce(v_item->'addon_ids', '[]'::jsonb)) as x(val);

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

    -- -----------------------------------------------------------------------
    -- Per-product options: walk THIS product's own declared options (never
    -- the whole catalog, never another product's) and resolve whatever the
    -- client claims was selected against them. Anything the client sends
    -- that doesn't match a real option/choice on this exact product is
    -- silently ignored, not trusted, and never priced.
    -- -----------------------------------------------------------------------
    v_selected_options := '[]'::jsonb;
    v_options_total := 0;

    for v_opt in select * from product_options where product_id = v_product.id order by sort_order
    loop
      select elem -> 'value' into v_opt_value_raw
      from jsonb_array_elements(coalesce(v_item -> 'selected_options', '[]'::jsonb)) elem
      where elem ->> 'key' = v_opt.key
      limit 1;

      if v_opt.type = 'select' then
        v_value_text := nullif(v_opt_value_raw #>> '{}', '');
        if v_opt.required and v_value_text is null then
          raise exception 'Missing required option: %', v_opt.label;
        end if;
        if v_value_text is not null then
          select (choice ->> 'label'), coalesce((choice ->> 'priceDelta')::numeric, 0)
          into v_choice_label, v_choice_delta
          from jsonb_array_elements(v_opt.choices) choice
          where choice ->> 'value' = v_value_text
          limit 1;
          if v_choice_label is null then
            raise exception 'Invalid value for option: %', v_opt.label;
          end if;
          v_options_total := v_options_total + v_choice_delta;
          v_selected_options := v_selected_options || jsonb_build_array(jsonb_build_object(
            'key', v_opt.key, 'label', v_opt.label, 'type', v_opt.type,
            'value', v_value_text, 'valueLabel', v_choice_label, 'priceDelta', v_choice_delta
          ));
        end if;

      elsif v_opt.type = 'multiselect' then
        if v_opt.required and (v_opt_value_raw is null or jsonb_typeof(v_opt_value_raw) <> 'array' or jsonb_array_length(v_opt_value_raw) = 0) then
          raise exception 'Missing required option: %', v_opt.label;
        end if;
        v_ms_labels := array[]::text[];
        v_ms_delta := 0;
        if v_opt_value_raw is not null and jsonb_typeof(v_opt_value_raw) = 'array' then
          for v_ms_val in select jsonb_array_elements_text(v_opt_value_raw)
          loop
            select (choice ->> 'label'), coalesce((choice ->> 'priceDelta')::numeric, 0)
            into v_choice_label, v_choice_delta
            from jsonb_array_elements(v_opt.choices) choice
            where choice ->> 'value' = v_ms_val
            limit 1;
            if v_choice_label is null then
              raise exception 'Invalid value for option: %', v_opt.label;
            end if;
            v_ms_labels := array_append(v_ms_labels, v_choice_label);
            v_ms_delta := v_ms_delta + v_choice_delta;
          end loop;
        end if;
        if array_length(v_ms_labels, 1) > 0 then
          v_options_total := v_options_total + v_ms_delta;
          v_selected_options := v_selected_options || jsonb_build_array(jsonb_build_object(
            'key', v_opt.key, 'label', v_opt.label, 'type', v_opt.type,
            'value', to_jsonb(v_ms_labels), 'valueLabel', array_to_string(v_ms_labels, ', '), 'priceDelta', v_ms_delta
          ));
        end if;

      elsif v_opt.type = 'boolean' then
        v_value_text := v_opt_value_raw #>> '{}';
        if v_opt.required and coalesce(v_value_text, 'false') <> 'true' then
          raise exception 'Missing required option: %', v_opt.label;
        end if;
        if v_value_text = 'true' then
          v_options_total := v_options_total + v_opt.price_delta;
          v_selected_options := v_selected_options || jsonb_build_array(jsonb_build_object(
            'key', v_opt.key, 'label', v_opt.label, 'type', v_opt.type,
            'value', true, 'valueLabel', v_opt.label, 'priceDelta', v_opt.price_delta
          ));
        end if;

      elsif v_opt.type = 'text' then
        v_value_text := nullif(btrim(coalesce(v_opt_value_raw #>> '{}', '')), '');
        if v_opt.required and v_value_text is null then
          raise exception 'Missing required option: %', v_opt.label;
        end if;
        if v_value_text is not null then
          if v_opt.max_length is not null then
            v_value_text := left(v_value_text, v_opt.max_length);
          end if;
          v_selected_options := v_selected_options || jsonb_build_array(jsonb_build_object(
            'key', v_opt.key, 'label', v_opt.label, 'type', v_opt.type,
            'value', v_value_text, 'valueLabel', v_value_text, 'priceDelta', 0
          ));
        end if;

      elsif v_opt.type = 'number' then
        v_value_num := nullif(v_opt_value_raw #>> '{}', '')::numeric;
        if v_opt.required and v_value_num is null then
          raise exception 'Missing required option: %', v_opt.label;
        end if;
        if v_value_num is not null and v_value_num <> 0 then
          v_value_num := greatest(0, least(999, v_value_num));
          v_choice_delta := v_opt.price_delta * v_value_num;
          v_options_total := v_options_total + v_choice_delta;
          v_selected_options := v_selected_options || jsonb_build_array(jsonb_build_object(
            'key', v_opt.key, 'label', v_opt.label, 'type', v_opt.type,
            'value', v_value_num, 'valueLabel', v_value_num::text, 'priceDelta', v_choice_delta
          ));
        end if;
      end if;
    end loop;

    v_line_total := (coalesce(v_unit_price, 0) * v_quantity) + coalesce(v_addons_total, 0) + coalesce(v_options_total, 0);
    v_subtotal := v_subtotal + v_line_total;

    insert into order_items (
      order_id, product_id, product_name, product_name_ar, product_name_so, product_image,
      unit_price, quantity, addons, addons_total, line_total,
      variant_id, variant_name, variant_sku, selected_options
    ) values (
      v_order_id, v_product.id, v_item_name, v_item_name_ar, v_item_name_so, v_item_image,
      coalesce(v_unit_price, 0), v_quantity, v_addons, coalesce(v_addons_total, 0), v_line_total,
      v_variant_id, v_variant_name, v_variant_sku,
      case when jsonb_array_length(v_selected_options) > 0 then v_selected_options else null end
    );
  end loop;

  update product_orders set subtotal = v_subtotal, total = v_subtotal where id = v_order_id;

  return v_reference;
end;
$$;

revoke all on function public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb, text) from public;
grant execute on function public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb, text) to anon, authenticated;
