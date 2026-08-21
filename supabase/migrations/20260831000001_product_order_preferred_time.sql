-- ============================================================================
-- Go Hargeisa — product_orders.preferred_time
--
-- NOT APPLIED ANYWHERE YET. Written for review per the project owner's
-- explicit request (2026-08-20), following the Part 1/Part 2 category-aware
-- audit: flower/cake orders need a delivery TIME, not just a delivery date.
-- `product_orders.preferred_date` (date, no time component) was the only
-- scheduling field that existed — this was reported as a genuine gap
-- requiring a schema change, not something buildable on the existing
-- per-product options architecture (options are per-product, not
-- per-order/scheduling). Do not apply without explicit sign-off.
--
-- WHAT THIS ADDS
--   1. product_orders.preferred_time — nullable text column (free-form,
--      e.g. "14:00" or "Afternoon (2-5 PM)" — text rather than a strict
--      `time` type so a business can offer a time WINDOW, not just an exact
--      clock time, matching how `preferred_date` itself is optional and
--      business-interpreted, not a hard scheduling commitment). NULL for
--      every existing order and for any caller that doesn't send one —
--      completely inert until a value is actually passed.
--   2. submit_cart_order() gains one new, LAST parameter,
--      `p_preferred_time text default null`. Verified live immediately
--      before writing this file: the current signature is the 14-arg
--      version ending in `p_items jsonb, p_idempotency_key text`. UNLIKE
--      20260829000001 (which only widened the JSON *shape* inside the
--      existing p_items parameter, not the function's own parameter list),
--      this migration adds a genuinely new 15th parameter — Postgres
--      identifies a function by its full parameter type list, so
--      `create or replace` alone here would NOT upgrade the live 14-arg
--      function, it would create a SECOND, ambiguous overload alongside it
--      (the exact bug 20260827000001's own header describes and guards
--      against). This migration therefore explicitly DROPs the live 14-arg
--      signature first, in the same atomic script, immediately before
--      creating the 15-arg one — so exactly one version of
--      submit_cart_order ever exists at a time, with no window where both
--      are live.
--
-- SAFETY
--   Purely additive: one new nullable column, one new function parameter
--   with a default. No table, column, row, or policy is dropped — the only
--   DROP is the old submit_cart_order function overload itself (immediately
--   replaced in the same script; functions hold no data). No
--   UPDATE/DELETE/INSERT touches any existing row's data — the new column
--   is populated via `add column ... ` with no default value that could
--   affect a pre-existing row (every existing order simply gets NULL).
--   Every existing call site (the app today, which doesn't yet send this
--   parameter) keeps working unmodified against the new signature — the
--   RPC call would need to add `p_preferred_time` before any client
--   actually starts sending real values, but the signature itself accepts
--   omitting it right away. Idempotent, safe to re-run.
--
-- NOT PART OF THIS FILE (deliberately) — application code (checkout form,
-- submitCartOrder action, order display in business/admin dashboards) is
-- NOT wired to this column yet. Sending an unrecognized named parameter to
-- a live PostgREST RPC call fails outright (unlike the selected_options
-- case, which rode inside the already-existing p_items jsonb shape) — so
-- that wiring must wait until AFTER this migration is applied, as a
-- separate step.
-- ============================================================================

alter table product_orders add column if not exists preferred_time text;

-- Must drop the old 14-arg signature before creating the 15-arg one — see
-- the file header. Both statements run atomically in this one script, so no
-- live caller can ever observe an in-between state with zero or two
-- overloads.
drop function if exists public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb, text);

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

revoke all on function public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb, text, text) from public;
grant execute on function public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb, text, text) to anon, authenticated;
