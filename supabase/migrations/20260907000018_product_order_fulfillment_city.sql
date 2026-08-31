-- ---------------------------------------------------------------------------
-- Adds a generic, optional "fulfillment city/branch" to product_orders —
-- built for Flormar Hargeisa's two real branches (Hargeisa, Somaliland and
-- Mogadishu, Somalia), but not hardcoded to Flormar: any future multi-branch
-- partner reuses the exact same column and RPC parameter. Every existing
-- partner/order is completely unaffected — the column is nullable, defaults
-- to null, and the RPC parameter is appended at the end with `default null`
-- (same additive pattern 20260831000001 used for p_preferred_time, and
-- 20260906000001 used for the tax/add-ons params): existing callers that
-- never send it keep working byte-for-byte as before.
--
-- NOT YET APPLIED — written for review per the platform owner's explicit
-- approval-before-migration rule. Run via `supabase db push --linked` (or
-- the project's usual migration path) only after that approval.
--
-- Scope check performed before writing this (see conversation): the
-- platform has NO per-branch inventory anywhere (products/product_variants
-- carry exactly one is_available/stock_quantity, not one per city) — this
-- column is deliberately just an order-level fulfillment/location field,
-- not a claim that stock is tracked separately per branch. The storefront
-- UI must not imply otherwise until real branch inventory exists.
--
-- Rebuilt starting from 20260906000001's actual, complete, currently-live
-- function body (verified by directly reading that file in full) — every
-- existing line/column/param is preserved byte-for-byte; the only additions
-- are marked NEW below.
-- ---------------------------------------------------------------------------

alter table public.product_orders
  add column if not exists fulfillment_city text;

comment on column public.product_orders.fulfillment_city is
  'Optional order-level fulfillment location (e.g. "hargeisa", "mogadishu") for partners with multiple branches. Null for every order from a single-location business — this is a fulfillment/shipping-destination field, not evidence of per-branch inventory tracking.';

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
  p_preferred_time text default null,
  p_fulfillment_city text default null -- NEW
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
      occasion, message_note, notes, status, subtotal, total, user_id, idempotency_key,
      fulfillment_city -- NEW
    ) values (
      p_listing_type, p_listing_id, btrim(p_customer_name), btrim(p_customer_phone),
      v_fulfillment, nullif(btrim(coalesce(p_delivery_address, '')), ''), p_preferred_date,
      nullif(btrim(coalesce(p_preferred_time, '')), ''),
      nullif(btrim(coalesce(p_recipient_name, '')), ''), nullif(btrim(coalesce(p_recipient_phone, '')), ''),
      nullif(btrim(coalesce(p_occasion, '')), ''), nullif(btrim(coalesce(p_message_note, '')), ''),
      nullif(btrim(coalesce(p_notes, '')), ''), 'pending', 0, 0, auth.uid(), p_idempotency_key,
      nullif(btrim(coalesce(p_fulfillment_city, '')), '') -- NEW
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

revoke all on function public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb, text, text, text) from public;
grant execute on function public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb, text, text, text) to anon, authenticated;
