-- ============================================================================
-- Go Hargeisa — Reusable Product Variant/Shade System
--
-- NOT APPLIED ANYWHERE YET. Written for review per the project owner's
-- explicit request ("show me the proposed schema before applying it") and
-- because this environment has no isolated local/dev Supabase instance to
-- test against (no Docker available to run `supabase start`) — the only
-- reachable Supabase project is the live one already serving real
-- businesses (Lavender, Beydan Coffee, etc.), confirmed via a read-only
-- schema probe. Applying this is a decision for the project owner, from
-- their own machine or with explicit sign-off, not something done
-- automatically from here.
--
-- CORRECTED 2026-08-19: a read-only live-schema probe during the Part 1/
-- Part 2 platform audit found that 20260827000001_submit_cart_order_
-- idempotency.sql was already applied live BEFORE this file — the live
-- submit_cart_order() is the 14-arg, idempotency-aware version, and does
-- NOT include variant support (product_variants doesn't exist live;
-- order_items has no variant_id/variant_name/variant_sku columns). This
-- file originally assumed it would be applied on top of the stale 13-arg
-- pre-idempotency function, and its `submit_cart_order` block below has
-- been rewritten to instead widen the ACTUAL live 14-arg signature (adding
-- variant handling, keeping the idempotency short-circuit/unique_violation
-- handling verbatim) — applying the corrected version below is now safe
-- against live state. Do not reintroduce a 13-arg CREATE OR REPLACE here;
-- Postgres would create a second, ambiguous overload instead of upgrading
-- the live function.
--
-- Extends the EXISTING single product system (products / product_orders /
-- order_items, see 20260810000001_products_engine.sql and
-- 20260823000002_universal_cart_orders.sql) rather than creating a second
-- one. A product with zero variant rows behaves exactly as every product on
-- the platform does today — every existing listing (Lavender's flowers,
-- any perfume shop) is completely unaffected until it's given variants.
--
-- Purely additive: one new table + nullable snapshot columns on the
-- existing order_items table + a widened submit_cart_order() that accepts
-- an optional variant_id per cart line. Nothing existing is dropped,
-- renamed, or given a new NOT NULL constraint. Idempotent, safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. product_variants — one row per purchasable shade/finish/size of a
--    product. Any field left null falls back to the parent product's own
--    value at render time (handled in the app layer, lib/data/mappers.ts).
-- ---------------------------------------------------------------------------
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  name_ar text,
  name_so text,
  shade_name text,
  shade_code text,
  hex_color text,
  finish text,
  size text,
  image text,
  sku text,
  price numeric(10, 2),
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_variants_product on product_variants (product_id);

alter table product_variants enable row level security;

-- Mirrors products' own "public can read visible rows of a published
-- parent listing" shape exactly, just one hop further through products.
drop policy if exists "Public can read variants of visible products" on product_variants;
create policy "Public can read variants of visible products" on product_variants
  for select
  using (
    exists (
      select 1 from products p
      where p.id = product_variants.product_id
        and p.is_hidden = false
        and (
          (p.listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = p.listing_id and cs.status = 'published'))
          or (p.listing_type = 'service' and exists (select 1 from services s where s.id = p.listing_id and s.status = 'published'))
          or (p.listing_type = 'cafe' and exists (select 1 from cafes c where c.id = p.listing_id and c.status = 'published'))
          or (p.listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = p.listing_id and r.status = 'published'))
        )
    )
  );

drop policy if exists "Owners manage variants of their own products" on product_variants;
create policy "Owners manage variants of their own products" on product_variants
  for all
  using (
    exists (
      select 1 from products p
      where p.id = product_variants.product_id
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
      where p.id = product_variants.product_id
        and (
          (p.listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = p.listing_id and cs.owner_id = auth.uid()))
          or (p.listing_type = 'service' and exists (select 1 from services s where s.id = p.listing_id and s.owner_id = auth.uid()))
          or (p.listing_type = 'cafe' and exists (select 1 from cafes c where c.id = p.listing_id and c.owner_id = auth.uid()))
          or (p.listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = p.listing_id and r.owner_id = auth.uid()))
        )
    )
  );

drop policy if exists "Platform admin manages all product variants" on product_variants;
create policy "Platform admin manages all product variants" on product_variants
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

-- ---------------------------------------------------------------------------
-- 2. order_items — nullable variant snapshot columns, same "freeze what was
--    actually ordered" pattern as product_name/product_image/unit_price
--    already on this table. An order placed for "09 Rosewood" must keep
--    showing that forever, even if the variant is later renamed or deleted.
-- ---------------------------------------------------------------------------
alter table order_items add column if not exists variant_id uuid references product_variants(id) on delete set null;
alter table order_items add column if not exists variant_name text;
alter table order_items add column if not exists variant_sku text;

-- ---------------------------------------------------------------------------
-- 3. submit_cart_order — widened to accept an optional "variant_id" per
--    cart line (p_items jsonb shape becomes
--    [{ product_id, quantity, addon_ids, variant_id? }, ...]). When a line
--    carries a variant_id, its price/name/sku are taken from that variant
--    row (still resolved server-side, never trusted from the client) —
--    identical server-side-pricing posture as the rest of this function.
--    When variant_id is absent/null, behavior is byte-for-byte identical to
--    the current function: every existing call site (every product on the
--    platform today) keeps working unchanged.
--
--    Signature/body below matches the ACTUAL LIVE function (14 args,
--    idempotency-aware, from 20260827000001) plus variant handling layered
--    on top — see this file's header for why. `create or replace` on an
--    identical arg list upgrades the live function in place; it does not
--    create a second overload.
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
  p_items jsonb, -- [{ "product_id": uuid, "quantity": int, "addon_ids": uuid[], "variant_id": uuid|null }, ...]
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
begin
  -- Idempotency short-circuit — verbatim from the live 20260827 function.
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

  -- Isolated sub-block: only this INSERT's unique_violation (on
  -- idempotency_key) is caught here — verbatim from the live 20260827
  -- function, unchanged by variant support.
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
      and p.is_available = true; -- fix carried over from 20260826000001 — base
      -- product availability was never checked here (only the variant's own
      -- is_available, a few lines below, was) — see that migration's header
      -- for the full explanation. Applying this file already includes the
      -- fix, so 20260826000001 becomes a no-op if applied first or skipped
      -- entirely if this file is applied instead.

    if v_product.id is null then
      raise exception 'One of the selected products is no longer available';
    end if;

    v_quantity := greatest(1, least(20, coalesce((v_item->>'quantity')::integer, 1)));

    -- Variant resolution: must belong to this exact product. A null/absent
    -- variant_id (every order for a non-variant product, i.e. everything on
    -- the platform today) skips this entirely and falls through to the
    -- product's own name/image/price exactly as before.
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

    -- Add-ons are only ever valid for a product actually in the flower/gift
    -- vocabulary (same list as lib/config/product-categories.ts's
    -- FLOWER_SPECIALTY_CATEGORIES) — a café's own coffee/tea/food/cake menu
    -- items (category is null) can never carry cafes.flower_addons
    -- pricing, no matter what addon_ids a client sends.
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

    v_line_total := (coalesce(v_unit_price, 0) * v_quantity) + coalesce(v_addons_total, 0);
    v_subtotal := v_subtotal + v_line_total;

    insert into order_items (
      order_id, product_id, product_name, product_name_ar, product_name_so, product_image,
      unit_price, quantity, addons, addons_total, line_total,
      variant_id, variant_name, variant_sku
    ) values (
      v_order_id, v_product.id, v_item_name, v_item_name_ar, v_item_name_so, v_item_image,
      coalesce(v_unit_price, 0), v_quantity, v_addons, coalesce(v_addons_total, 0), v_line_total,
      v_variant_id, v_variant_name, v_variant_sku
    );
  end loop;

  update product_orders set subtotal = v_subtotal, total = v_subtotal where id = v_order_id;

  return v_reference;
end;
$$;

revoke all on function public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb, text) from public;
grant execute on function public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb, text) to anon, authenticated;
