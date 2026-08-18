-- ============================================================================
-- Go Hargeisa — submit_cart_order() idempotency (duplicate-order prevention)
--
-- PROPOSED ONLY. NOT YET APPLIED. Written for review per the project owner's
-- explicit request, 2026-08-18, following the order/inventory QA phase that
-- confirmed submit_cart_order() has no protection against a checkout request
-- being submitted twice (network retry after an ambiguous failure, a refresh
-- mid-flight, or a genuine concurrent double-send) — only a client-side
-- `disabled={isPending}` button guard exists today, which blocks a simple
-- impatient double-click but nothing else. See the header of
-- 20260826000001_fix_order_availability_check.sql for the sibling fix this
-- migration builds on top of (same live function, unmodified from here on
-- except for the addition below).
--
-- WHAT THIS ADDS
--   1. product_orders.idempotency_key — nullable text column. NULL for every
--      existing order (both of the 2 real rows currently in production) and
--      for any caller that doesn't yet send one — completely inert until a
--      value is actually passed.
--   2. A UNIQUE index on that column, scoped to non-null values only (a
--      partial index) — so any number of existing/legacy NULL rows coexist
--      without conflict; only two rows both carrying the *same real key*
--      value collide, which is exactly and only the case this exists to
--      prevent.
--   3. submit_cart_order() gains one new, LAST parameter,
--      `p_idempotency_key text default null`. Postgres identifies a function
--      by name + argument types, so a 14-arg signature is a genuinely
--      different, separately-overloaded function from the live 13-arg one —
--      CREATE OR REPLACE alone would leave BOTH versions callable at once,
--      which breaks PostgREST's RPC resolution (it cannot reliably pick an
--      overload when more than one exists for the same name). This migration
--      therefore explicitly DROPs the old 13-arg signature in the same
--      atomic script, immediately before creating the 14-arg one — so
--      exactly one version of submit_cart_order ever exists at a time, with
--      no window (even a sub-transaction one) where both are live. Every
--      existing call site (the app today, which doesn't yet send a key)
--      keeps working unmodified against the new signature, simply without
--      the new protection until the client is updated to start sending one.
--
-- HOW IT WORKS
--   - On entry, if a key is given, the function first checks whether an
--     order already exists under that key. If so, it returns that order's
--     reference immediately — no new insert, no re-validation — handling
--     both "the same click retried by the browser" and "the user manually
--     resubmitted after not seeing a confirmation" identically: same input,
--     same output, exactly once created.
--   - The actual product_orders INSERT is wrapped in its own sub-block with
--     `exception when unique_violation`. Two genuinely concurrent requests
--     carrying the same key can both pass the initial existence check before
--     either commits (a classic check-then-act race) — but only one INSERT
--     can ever succeed against the unique index; the loser catches that
--     specific error, looks up the winner's row, and returns its reference
--     instead of failing. Both callers see success and the same order
--     reference; exactly one row is ever created. The loser's order_items
--     loop never runs, so no partial/duplicate line items are ever written.
--   - A key that was never successfully committed (e.g. the first attempt
--     failed validation — empty cart, unavailable product) occupies no row,
--     so a retry with the *same* key after fixing the cart proceeds as a
--     normal fresh order — this is not a false duplicate.
--   - Every other validation — including the is_available check added in
--     20260826000001 — runs exactly as it does today for every genuinely
--     new submission. Nothing about that protection changes.
--
-- WHY A KEY, NOT A CONTENT/TIME HEURISTIC
--   A hash of (customer, items, listing) or a "same customer within N
--   seconds" window would incorrectly merge two real, separately-intended
--   orders (e.g. a customer legitimately re-ordering the exact same bouquet
--   five minutes later). A client-generated, cart-lifecycle-scoped key (see
--   the companion app-code proposal — NOT part of this SQL file) avoids that
--   false-positive entirely: the key lives with the cart in localStorage,
--   generated once when the cart is created and cleared only when the order
--   actually succeeds, so a retry of the same attempt always carries the
--   same key and a genuinely new order always starts with a fresh one, even
--   across a page refresh.
--
-- SAFETY
--   Purely additive. No existing row is touched (NULL for both of today's
--   real orders). No existing constraint, policy, or index is dropped.
--   Function behavior for any call that omits the new parameter is
--   byte-for-byte identical to the currently-live version. Idempotent/safe
--   to re-run (if-not-exists / drop-if-exists throughout).
-- ============================================================================

alter table product_orders add column if not exists idempotency_key text;

create unique index if not exists idx_product_orders_idempotency_key
  on product_orders (idempotency_key)
  where idempotency_key is not null;

-- Must drop the old 13-arg signature before creating the 14-arg one — see
-- the file header. Both statements run atomically in this one script, so no
-- live caller can ever observe an in-between state with zero or two
-- overloads.
drop function if exists public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb);

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
  p_items jsonb, -- [{ "product_id": uuid, "quantity": int, "addon_ids": uuid[] }, ...]
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
  v_quantity integer;
  v_addon_ids uuid[];
  v_addons jsonb;
  v_addons_total numeric(10, 2);
  v_line_total numeric(10, 2);
  v_is_flower_product boolean;
  v_existing_id uuid;
  v_existing_reference text;
begin
  -- Idempotency short-circuit: a prior call already committed under this
  -- exact key — return its reference as-is, no new row, no re-validation.
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
  -- idempotency_key) is caught here. A genuinely concurrent request with the
  -- same key that wins the race leaves this one to fall back to returning
  -- the winner's reference instead of erroring or double-inserting.
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

revoke all on function public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb, text) from public;
grant execute on function public.submit_cart_order(text, uuid, text, text, text, text, date, text, text, text, text, text, jsonb, text) to anon, authenticated;
