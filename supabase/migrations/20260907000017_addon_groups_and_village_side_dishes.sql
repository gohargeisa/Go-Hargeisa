-- ============================================================================
-- Go Hargeisa — Global, reusable Add-on Groups (platform-wide), plus
-- migrating The Village's 5 standalone "Side Dishes" products into it.
--
-- CONTEXT: the per-product add-on system (product_addons table,
-- getValidAddonsForProduct(), submit_cart_order's addon_ids resolution) was
-- already designed and shipped in
-- 20260906000001_tax_system_and_product_addons.sql — this migration only
-- adds the one genuinely missing piece: a REUSABLE group of add-ons that
-- can be assigned to many products at once (e.g. one "Side Dishes" group
-- assigned to several breakfast items), instead of duplicating the same 5
-- rows per product. Everything else (RLS shape, tax handling, order
-- snapshotting) is extended, not replaced.
--
-- SAFETY: purely additive at the schema level (two new tables, two new
-- nullable columns on the existing product_addons table, one CHECK
-- constraint on those two new columns only). submit_cart_order is replaced
-- at its exact existing 15-argument signature — no client call-shape
-- change. Zero existing product_addons rows exist anywhere in production
-- today (verified before writing this), so the new "exactly one of
-- product_id/group_id" constraint cannot conflict with anything live.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. addon_groups — a named, reusable set of add-ons owned by one listing
--    (never shared across businesses — same polymorphic listing_type/
--    listing_id shape as tax_policies/featured_partner_content).
--    min_select/max_select exist now purely so a future UI can enforce
--    "choose 1" / "choose up to 2" without another migration — 0/null
--    (unlimited optional multi-select) preserves today's exact checkbox
--    behavior; no new UI reads these yet.
-- ---------------------------------------------------------------------------
create table addon_groups (
  id uuid primary key default gen_random_uuid(),
  listing_type text not null check (listing_type in ('city_service', 'service', 'cafe', 'restaurant')),
  listing_id uuid not null,
  name text not null,
  name_ar text,
  name_so text,
  min_select integer not null default 0,
  max_select integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_addon_groups_listing on addon_groups (listing_type, listing_id);

alter table addon_groups enable row level security;

-- Public read: a group's own metadata (name, selection rule) reveals nothing
-- sensitive by itself — real customer-facing exposure is gated by
-- product_addons' and product_addon_groups' own policies below, same
-- "existence isn't the sensitive part" reasoning as featured_partner_content.
create policy "Public reads addon groups" on addon_groups for select using (true);

create policy "Owners manage their own addon groups" on addon_groups for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'owner')
    or (listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = addon_groups.listing_id and cs.owner_id = auth.uid()))
    or (listing_type = 'service' and exists (select 1 from services s where s.id = addon_groups.listing_id and s.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = addon_groups.listing_id and c.owner_id = auth.uid()))
    or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = addon_groups.listing_id and r.owner_id = auth.uid()))
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'owner')
    or (listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = addon_groups.listing_id and cs.owner_id = auth.uid()))
    or (listing_type = 'service' and exists (select 1 from services s where s.id = addon_groups.listing_id and s.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = addon_groups.listing_id and c.owner_id = auth.uid()))
    or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = addon_groups.listing_id and r.owner_id = auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- 2. product_addons — extended, not replaced. A row is now EITHER owned by
--    exactly one product (product_id set, the original 20260906000001
--    shape, unchanged behavior) OR owned by a group (group_id set) that's
--    shared across whichever products are assigned to it via
--    product_addon_groups below. Never both, never neither — enforced by
--    the CHECK constraint, so there is no ambiguous/dual-owned row possible.
-- ---------------------------------------------------------------------------
alter table product_addons alter column product_id drop not null;
alter table product_addons add column group_id uuid references addon_groups(id) on delete cascade;

alter table product_addons add constraint product_addons_owner_shape check (
  (product_id is not null and group_id is null) or (product_id is null and group_id is not null)
);

create index idx_product_addons_group on product_addons (group_id);

-- ---------------------------------------------------------------------------
-- 3. product_addon_groups — which products display which group's add-ons.
--    Many-to-many by design (a group can be assigned to several products;
--    a product could in principle carry more than one group, e.g. "Side
--    Dishes" + a future "Extra Protein" group).
-- ---------------------------------------------------------------------------
create table product_addon_groups (
  product_id uuid not null references products(id) on delete cascade,
  group_id uuid not null references addon_groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, group_id)
);

create index idx_product_addon_groups_group on product_addon_groups (group_id);

alter table product_addon_groups enable row level security;

-- Public read: a bare (product_id, group_id) link reveals nothing beyond two
-- already-independently-gated ids — real exposure is the product_addons
-- policy below and the products table's own visibility policy.
create policy "Public reads product addon group assignments" on product_addon_groups for select using (true);

create policy "Owners manage their own product addon group assignments" on product_addon_groups for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'owner')
    or exists (
      select 1 from products p
      where p.id = product_addon_groups.product_id
        and (
          (p.listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = p.listing_id and cs.owner_id = auth.uid()))
          or (p.listing_type = 'service' and exists (select 1 from services s where s.id = p.listing_id and s.owner_id = auth.uid()))
          or (p.listing_type = 'cafe' and exists (select 1 from cafes c where c.id = p.listing_id and c.owner_id = auth.uid()))
          or (p.listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = p.listing_id and r.owner_id = auth.uid()))
        )
    )
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'owner')
    or exists (
      select 1 from products p
      where p.id = product_addon_groups.product_id
        and (
          (p.listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = p.listing_id and cs.owner_id = auth.uid()))
          or (p.listing_type = 'service' and exists (select 1 from services s where s.id = p.listing_id and s.owner_id = auth.uid()))
          or (p.listing_type = 'cafe' and exists (select 1 from cafes c where c.id = p.listing_id and c.owner_id = auth.uid()))
          or (p.listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = p.listing_id and r.owner_id = auth.uid()))
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 4. product_addons RLS — extended (dropped + recreated) to also cover
--    group-owned rows, which the original 20260906000001 policies can't see
--    (they only ever matched product_addons.product_id against a real
--    product; a group-owned row has product_id = null). The original
--    direct-product clause is preserved byte-for-byte as the first branch
--    of each OR — a product-owned row's visibility/ownership is completely
--    unchanged by this migration.
-- ---------------------------------------------------------------------------
drop policy if exists "Public can read active add-ons of visible products" on product_addons;
create policy "Public can read active add-ons of visible products" on product_addons
  for select using (
    is_active = true
    and (
      exists (
        select 1 from products p
        where p.id = product_addons.product_id
          and p.is_hidden = false
          and (
            (p.listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = p.listing_id and cs.status = 'published'))
            or (p.listing_type = 'service' and exists (select 1 from services s where s.id = p.listing_id and s.status = 'published'))
            or (p.listing_type = 'cafe' and exists (select 1 from cafes c where c.id = p.listing_id and c.status = 'published' and c.ordering_enabled = true))
            or (p.listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = p.listing_id and r.status = 'published' and r.ordering_enabled = true))
          )
      )
      or exists (
        select 1 from product_addon_groups pag
        join products p on p.id = pag.product_id
        where pag.group_id = product_addons.group_id
          and p.is_hidden = false
          and (
            (p.listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = p.listing_id and cs.status = 'published'))
            or (p.listing_type = 'service' and exists (select 1 from services s where s.id = p.listing_id and s.status = 'published'))
            or (p.listing_type = 'cafe' and exists (select 1 from cafes c where c.id = p.listing_id and c.status = 'published' and c.ordering_enabled = true))
            or (p.listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = p.listing_id and r.status = 'published' and r.ordering_enabled = true))
          )
      )
    )
  );

drop policy if exists "Owners manage their own product add-ons" on product_addons;
create policy "Owners manage their own product add-ons" on product_addons for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'owner')
    or exists (
      select 1 from products p
      where p.id = product_addons.product_id
        and (
          (p.listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = p.listing_id and cs.owner_id = auth.uid()))
          or (p.listing_type = 'service' and exists (select 1 from services s where s.id = p.listing_id and s.owner_id = auth.uid()))
          or (p.listing_type = 'cafe' and exists (select 1 from cafes c where c.id = p.listing_id and c.owner_id = auth.uid()))
          or (p.listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = p.listing_id and r.owner_id = auth.uid()))
        )
    )
    or exists (
      select 1 from addon_groups ag
      where ag.id = product_addons.group_id
        and (
          (ag.listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = ag.listing_id and cs.owner_id = auth.uid()))
          or (ag.listing_type = 'service' and exists (select 1 from services s where s.id = ag.listing_id and s.owner_id = auth.uid()))
          or (ag.listing_type = 'cafe' and exists (select 1 from cafes c where c.id = ag.listing_id and c.owner_id = auth.uid()))
          or (ag.listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = ag.listing_id and r.owner_id = auth.uid()))
        )
    )
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'owner')
    or exists (
      select 1 from products p
      where p.id = product_addons.product_id
        and (
          (p.listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = p.listing_id and cs.owner_id = auth.uid()))
          or (p.listing_type = 'service' and exists (select 1 from services s where s.id = p.listing_id and s.owner_id = auth.uid()))
          or (p.listing_type = 'cafe' and exists (select 1 from cafes c where c.id = p.listing_id and c.owner_id = auth.uid()))
          or (p.listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = p.listing_id and r.owner_id = auth.uid()))
        )
    )
    or exists (
      select 1 from addon_groups ag
      where ag.id = product_addons.group_id
        and (
          (ag.listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = ag.listing_id and cs.owner_id = auth.uid()))
          or (ag.listing_type = 'service' and exists (select 1 from services s where s.id = ag.listing_id and s.owner_id = auth.uid()))
          or (ag.listing_type = 'cafe' and exists (select 1 from cafes c where c.id = ag.listing_id and c.owner_id = auth.uid()))
          or (ag.listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = ag.listing_id and r.owner_id = auth.uid()))
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 5. submit_cart_order — replaced in place at its existing 15-argument
--    signature (unchanged from 20260906000001/20260831000001). The ONLY
--    change from the previous version is one added UNION ALL branch in the
--    add-on resolution subquery (marked NEW GROUP below): an addon_id also
--    resolves when it belongs to a group assigned to this exact product via
--    product_addon_groups. Every other line — variant resolution, options
--    resolution, tax resolution, idempotency — is preserved byte-for-byte
--    from the live version.
--
--    Isolation guarantee: an addon_id only ever resolves for a given
--    product if it is (a) directly owned by that product_id, (b) owned by a
--    group explicitly assigned to that product_id, or (c) the legacy
--    flower_addons path gated to flower-category cafe products. A crafted
--    client request supplying another business's or another product's
--    addon_id matches none of the three branches and is silently excluded
--    from the total — never applied, never erroring in a way that leaks
--    whether that id exists elsewhere.
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
  p_items jsonb, -- [{ "product_id": uuid, "quantity": int, "addon_ids": uuid[], "variant_id": uuid, "selected_options": [...] }, ...]
  p_idempotency_key text default null,
  p_preferred_time text default null
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
  v_opt record;
  v_opt_value_raw jsonb;
  v_value_text text;
  v_value_num numeric;
  v_choice_delta numeric;
  v_choice_label text;
  v_ms_val text;
  v_ms_labels text[];
  v_ms_delta numeric;
  v_selected_options jsonb;
  v_options_total numeric(10, 2);
  v_taxable_addons_total numeric(10, 2);
  v_taxable_subtotal numeric(10, 2) := 0;
  v_tax_amount numeric(10, 2) := 0;
  v_total numeric(10, 2) := 0;
  v_blended_rate numeric(6, 5) := 0;
  v_order_tax_label text;
  v_any_inclusive boolean := false;
  v_tax record;
  v_line_taxable_base numeric(10, 2);
  v_line_tax numeric(10, 2);
  v_line_exempt boolean;
begin
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
      fulfillment_type, delivery_address, preferred_date, preferred_time, recipient_name, recipient_phone,
      occasion, message_note, notes, status, subtotal, total, user_id, idempotency_key
    ) values (
      p_listing_type, p_listing_id, btrim(p_customer_name), btrim(p_customer_phone),
      v_fulfillment, nullif(btrim(coalesce(p_delivery_address, '')), ''), p_preferred_date,
      nullif(btrim(coalesce(p_preferred_time, '')), ''),
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

    -- Add-ons resolve three ways, in order:
    --  (a) product_addons directly owned by this product_id.
    --  (b) NEW GROUP: product_addons owned by a group assigned to this
    --      product_id via product_addon_groups.
    --  (c) cafes.flower_addons — the pre-existing business-wide vocabulary,
    --      still gated to flower/gift-category products on a cafe.
    select
      coalesce(jsonb_agg(jsonb_build_object('id', src.id, 'name', src.name, 'price', src.price, 'isTaxable', src.is_taxable)), '[]'::jsonb),
      coalesce(sum(src.price), 0),
      coalesce(sum(src.price) filter (where src.is_taxable), 0)
    into v_addons, v_addons_total, v_taxable_addons_total
    from (
      select pa.id, pa.name, pa.price, pa.is_taxable
      from product_addons pa
      where pa.product_id = v_product.id and pa.id = any(v_addon_ids) and pa.is_active = true
      union all
      -- NEW GROUP
      select pa.id, pa.name, pa.price, pa.is_taxable
      from product_addons pa
      join product_addon_groups pag on pag.group_id = pa.group_id
      where pag.product_id = v_product.id and pa.id = any(v_addon_ids) and pa.is_active = true
      union all
      select (a.addon ->> 'id')::uuid, a.addon ->> 'name', (a.addon ->> 'price')::numeric, true
      from cafes c
      cross join lateral jsonb_array_elements(c.flower_addons) as a(addon)
      where c.id = p_listing_id
        and p_listing_type = 'cafe'
        and v_is_flower_product
        and (a.addon ->> 'id')::uuid = any(v_addon_ids)
        and (a.addon ->> 'id')::uuid not in (select pa2.id from product_addons pa2 where pa2.product_id = v_product.id)
    ) src;

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

    select * into v_tax from resolve_tax_policy(p_listing_type, p_listing_id, v_product.category, v_product.id);
    v_line_exempt := coalesce(v_tax.is_exempt, false);
    v_line_taxable_base := case when v_line_exempt then 0
      else (coalesce(v_unit_price, 0) * v_quantity) + coalesce(v_taxable_addons_total, 0) + coalesce(v_options_total, 0) end;
    v_line_tax := case
      when v_line_exempt or coalesce(v_tax.rate, 0) = 0 then 0
      when coalesce(v_tax.is_inclusive, false) then round(v_line_taxable_base * v_tax.rate / (1 + v_tax.rate), 2)
      else round(v_line_taxable_base * v_tax.rate, 2)
    end;

    v_taxable_subtotal := v_taxable_subtotal + v_line_taxable_base;
    v_tax_amount := v_tax_amount + v_line_tax;
    if v_order_tax_label is null and v_tax.label is not null then
      v_order_tax_label := v_tax.label;
    end if;
    if coalesce(v_tax.is_inclusive, false) then
      v_any_inclusive := true;
      v_total := v_total + v_line_total;
    else
      v_total := v_total + v_line_total + v_line_tax;
    end if;

    insert into order_items (
      order_id, product_id, product_name, product_name_ar, product_name_so, product_image,
      unit_price, quantity, addons, addons_total, line_total,
      variant_id, variant_name, variant_sku, selected_options, is_tax_exempt
    ) values (
      v_order_id, v_product.id, v_item_name, v_item_name_ar, v_item_name_so, v_item_image,
      coalesce(v_unit_price, 0), v_quantity, v_addons, coalesce(v_addons_total, 0), v_line_total,
      v_variant_id, v_variant_name, v_variant_sku,
      case when jsonb_array_length(v_selected_options) > 0 then v_selected_options else null end,
      v_line_exempt
    );
  end loop;

  v_blended_rate := case when v_taxable_subtotal > 0 then round(v_tax_amount / v_taxable_subtotal, 5) else 0 end;

  update product_orders set
    subtotal = v_subtotal,
    taxable_subtotal = v_taxable_subtotal,
    tax_rate = v_blended_rate,
    tax_amount = v_tax_amount,
    tax_is_inclusive = v_any_inclusive,
    tax_policy_label = v_order_tax_label,
    total = v_total
  where id = v_order_id;

  return v_reference;
end;
$$;

revoke all on function public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb, text, text) from public;
grant execute on function public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb, text, text) to anon, authenticated;

-- ============================================================================
-- 6. THE VILLAGE — migrate the 5 standalone "Side Dishes" products into one
--    reusable add-on group, assign it to specific breakfast products (per
--    explicit direction — sweet items get Honey/Yogurt, savory items get
--    Olives/Zait & Za'atar/Mukhalal, nothing assigned where the original
--    menu doesn't clearly support it), then hide the 5 old standalone
--    product rows. Rows are hidden, NEVER deleted — zero historical orders
--    reference them (verified before writing this), but hiding rather than
--    deleting means there is no possible historical-order or FK-integrity
--    risk either way, matching the explicit instruction not to hard-delete.
-- ============================================================================

insert into addon_groups (id, listing_type, listing_id, name, sort_order)
values ('a1000000-0000-4000-8000-000000000001', 'restaurant', '2237bbdf-4f24-494e-b7e0-b90b58e8c39f', 'Side Dishes', 0);

-- Same ids, names, and prices as the 5 standalone products being retired —
-- copied exactly, nothing invented.
insert into product_addons (group_id, name, price, is_taxable, is_active, sort_order) values
  ('a1000000-0000-4000-8000-000000000001', 'Honey', 0.50, true, true, 0),
  ('a1000000-0000-4000-8000-000000000001', 'Yogurt', 0.50, true, true, 1),
  ('a1000000-0000-4000-8000-000000000001', 'Olives', 0.50, true, true, 2),
  ('a1000000-0000-4000-8000-000000000001', 'Zait & Za''atar', 1.00, true, true, 3),
  ('a1000000-0000-4000-8000-000000000001', 'Mukhalal (Pickled Vegetables)', 0.50, true, true, 4);

-- Assign the group only to the specific breakfast products where it's
-- clearly appropriate (see migration header) — not to every breakfast item,
-- and not to Burgers/Pizza/Pastas/Manakeesh/Grills/Specials at all.
insert into product_addon_groups (product_id, group_id) values
  ('55016509-6ca5-45ff-9041-2d50ca2d4d7a', 'a1000000-0000-4000-8000-000000000001'), -- Eggs
  ('6579fbec-cde0-437a-9cc9-f4c0bb51801c', 'a1000000-0000-4000-8000-000000000001'), -- French Toast
  ('558ff81f-95ac-45e8-8e7c-44ad60917e3b', 'a1000000-0000-4000-8000-000000000001'), -- Pan Cakes
  ('9875b98e-faa3-4bc0-9dc0-ed51bf663b0d', 'a1000000-0000-4000-8000-000000000001'), -- Porridge
  ('32b4f2a6-73ac-4a3c-a992-cc4e325a14b1', 'a1000000-0000-4000-8000-000000000001'), -- Fresh Fruit Salad
  ('b4a013ef-537e-4a2f-a023-df4ac99a9132', 'a1000000-0000-4000-8000-000000000001'), -- Fluffy Loxoox
  ('d189e558-2a03-4591-8378-f1796cfac936', 'a1000000-0000-4000-8000-000000000001'), -- Arabic Breakfast
  ('c7534d02-3183-466d-a668-2f73165d7b53', 'a1000000-0000-4000-8000-000000000001'), -- Beans
  ('130286bc-eda0-46d9-86c9-387620200bcc', 'a1000000-0000-4000-8000-000000000001'), -- Sauteed Liver
  ('61d55576-c612-447e-996e-3f0f70c116fd', 'a1000000-0000-4000-8000-000000000001'); -- Beef Stir Fry (Suqar)
  -- English Breakfast deliberately excluded: a distinct Western fry-up, no
  -- clear pairing with these Levantine/Somali condiments in the source menu.

-- Retire the 5 old standalone products from the customer-facing catalog.
-- Hidden, not deleted — rows remain intact for referential/historical
-- integrity even though nothing currently references them.
update products
set is_hidden = true, is_available = false
where id in (
  'ccea594a-9aec-4e0f-8ff0-e700b112e0f1', -- Honey
  '545840a8-97cc-4322-ba8d-a92e1a91d0cd', -- Yogurt
  '992b8af1-980a-443c-a1b8-1aaa2b72eba7', -- Olives
  '2cac4bc4-9c45-400b-a82c-f171c8389283', -- Zait & Za'atar
  '65c806ea-0e3d-4e38-ab58-560b10134aae'  -- Mukhalal (Pickled Vegetables)
);

-- Defensive self-check.
do $$
declare
  visible_side_dishes int;
  addon_count int;
  assignment_count int;
begin
  select count(*) into visible_side_dishes
  from products
  where listing_type = 'restaurant' and listing_id = '2237bbdf-4f24-494e-b7e0-b90b58e8c39f'
    and category = 'Side Dishes' and is_hidden = false;
  if visible_side_dishes != 0 then
    raise exception 'Expected 0 visible Side Dishes products, found %', visible_side_dishes;
  end if;

  select count(*) into addon_count from product_addons where group_id = 'a1000000-0000-4000-8000-000000000001';
  if addon_count != 5 then
    raise exception 'Expected 5 addons in the Village Side Dishes group, found %', addon_count;
  end if;

  select count(*) into assignment_count from product_addon_groups where group_id = 'a1000000-0000-4000-8000-000000000001';
  if assignment_count != 10 then
    raise exception 'Expected 10 product assignments for the Village Side Dishes group, found %', assignment_count;
  end if;
end $$;
