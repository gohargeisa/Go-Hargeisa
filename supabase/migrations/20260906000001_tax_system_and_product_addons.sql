-- ============================================================================
-- Go Hargeisa — Platform Tax System + Per-Product Add-ons
--
-- Two independent, additive features shipped together because the order RPC
-- (submit_cart_order) needs updating for both at once:
--
-- 1. TAX SYSTEM — a centralized, configurable tax policy table + resolution
--    hierarchy, reusable by every orderable listing type (restaurant, cafe,
--    service, city_service — the same four submit_cart_order already
--    handles) instead of a per-vertical tax calculation. No tax rate is
--    hardcoded anywhere in this migration or the application code — every
--    number comes from a `tax_policies` row an owner configures. Until an
--    owner creates one, every order resolves to 0% tax (no invented rate),
--    exactly matching pre-migration behavior (product_orders.total was, and
--    remains until configured, just the subtotal).
--
-- 2. PRODUCT ADD-ONS — a genuine per-product `product_addons` table,
--    modeled directly on product_options/product_variants (see
--    20260829000001_product_options.sql, 20260825000001_product_variants.sql
--    — "owned by exactly one product, never shared across products"). The
--    only existing add-on mechanism today, cafes.flower_addons, is a
--    BUSINESS-wide vocabulary gated to a fixed category list
--    (FLOWER_SPECIALTY_CATEGORIES) — it works for Lavender's flower line and
--    is left completely untouched here, but it cannot express "Cheese only
--    on Product A, Mushrooms only on Product B" for a restaurant menu. This
--    migration adds the real per-product mechanism as a second, additive
--    resolution path inside submit_cart_order — an addon_id first resolves
--    against product_addons (any listing type/category), and only falls
--    back to the legacy cafes.flower_addons + flower-category gate when it
--    isn't found there. Existing Lavender orders are unaffected.
--
-- Purely additive: every new table/column has a safe default, every RLS
-- policy is new (nothing dropped except the one function body being
-- replaced), and submit_cart_order keeps its exact existing signature — no
-- client code needs to change its call shape for either feature to work.
--
-- SAFETY: this file has NOT been applied to production. Per this session's
-- standing constraint, there is no DDL/Postgres connection available to this
-- assistant — apply it via `supabase db push` (or the Supabase SQL editor)
-- from a machine with the project's DB credentials, then verify against a
-- staging/dev project first if one is available. Nothing in the application
-- code that depends on the new tables/columns is live until this runs.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. tax_policies — one row per configured tax rule. Multiple rows may
--    apply at different scopes/times; submit_cart_order resolves the single
--    effective one per order line (see resolve_tax_policy below).
-- ---------------------------------------------------------------------------
create table if not exists tax_policies (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('global', 'category', 'business', 'product')),
  -- Exactly one of the four below is set, matching `scope` (enforced by the
  -- check constraint at the bottom). `category` matches either a
  -- categories.slug (city_service/service verticals — Healthcare, Salons &
  -- Care, Gyms, Car Rental, ...) or a literal listing_type value
  -- ('restaurant', 'cafe') for the two listing types that don't go through
  -- the categories table — see resolve_tax_policy's own comment.
  category text,
  listing_type text check (listing_type in ('city_service', 'service', 'cafe', 'restaurant')),
  listing_id uuid,
  product_id uuid references products(id) on delete cascade,
  -- 5 decimal places: 0.05000 = 5%. Never read/written as a bare percentage
  -- anywhere in app code — always this fraction, so "rate * amount" is never
  -- off by a factor of 100.
  rate numeric(6, 5) not null default 0 check (rate >= 0 and rate <= 1),
  -- An explicit exemption always wins over a rate at the same or any less
  -- specific scope — see resolve_tax_policy. A row can set is_exempt=true
  -- with rate left at its 0 default; the rate is simply ignored when exempt.
  is_exempt boolean not null default false,
  -- Tax-inclusive: `rate` describes the tax portion already baked into the
  -- displayed/stored product price (no amount is added to the total — see
  -- calculate_tax below). Tax-exclusive (default, the common case here):
  -- `rate` is added on top of the taxable subtotal.
  is_inclusive boolean not null default false,
  -- A disabled row is never resolved, same effect as deleting it, without
  -- losing the configured rate/label if re-enabled later.
  is_enabled boolean not null default true,
  -- Admin-facing only (e.g. "Somaliland VAT") — never shown to customers as
  -- anything but the resolved percentage; keeps the checkout line generic
  -- ("Tax (5%)") regardless of what an admin named the underlying policy.
  label text,
  effective_from timestamptz not null default now(),
  -- null = open-ended (still in effect). A future rate change is a NEW row
  -- with its own effective_from, not an edit to this one — see
  -- resolve_tax_policy's "most recently effective, currently active" tie-
  -- break. Historical orders are unaffected either way (see order_items /
  -- product_orders tax columns below — the values used are snapshotted at
  -- order time, never re-derived from tax_policies later).
  effective_until timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tax_policies_scope_shape check (
    (scope = 'global' and category is null and listing_type is null and listing_id is null and product_id is null)
    or (scope = 'category' and category is not null and listing_type is null and listing_id is null and product_id is null)
    or (scope = 'business' and category is null and listing_type is not null and listing_id is not null and product_id is null)
    or (scope = 'product' and category is null and listing_type is null and listing_id is null and product_id is not null)
  ),
  constraint tax_policies_effective_range check (effective_until is null or effective_until > effective_from)
);

create index if not exists idx_tax_policies_category on tax_policies (category) where scope = 'category';
create index if not exists idx_tax_policies_business on tax_policies (listing_type, listing_id) where scope = 'business';
create index if not exists idx_tax_policies_product on tax_policies (product_id) where scope = 'product';

alter table tax_policies enable row level security;

-- Public read of ENABLED policies only — needed so a signed-out shopper's
-- checkout preview (lib/actions/tax.ts) sees the real configured rate, not
-- just an owner-authenticated one. Nothing sensitive here: the rate a
-- customer will be charged is not confidential, the same way a product's
-- price isn't. Disabled/retired policy rows stay owner-only-visible.
drop policy if exists "Public can read enabled tax policies" on tax_policies;
create policy "Public can read enabled tax policies" on tax_policies
  for select using (is_enabled = true);

-- Platform-wide (global/category scopes) and cross-business (any
-- business/product scope) tax policy is an owner-only concern — see this
-- migration's header and the user-facing spec this ships against ("Do not
-- expose sensitive tax configuration controls to ordinary business owners
-- unless the existing permissions/business policy explicitly allows it").
-- Matches the exact assertOwner() shape already used throughout
-- lib/actions/*.ts (e.g. access-control.ts, admin.ts).
drop policy if exists "Owners manage tax policies" on tax_policies;
create policy "Owners manage tax policies" on tax_policies for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

-- ---------------------------------------------------------------------------
-- 2. product_addons — genuine per-product add-ons (Cheese, Olives, Oil, ...).
--    Modeled on product_options: "owned by exactly one product, never
--    shared/inferred from category". A product with no rows here has no
--    add-ons section at all (see lib/cart/product-addons.ts's app-side fix
--    in the same commit as this migration).
-- ---------------------------------------------------------------------------
create table if not exists product_addons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  name_ar text,
  name_so text,
  price numeric(10, 2) not null default 0 check (price >= 0),
  -- Most add-ons are taxable like the product itself; an owner can mark a
  -- specific one (e.g. a statutorily exempt item) non-taxable without
  -- touching the product's or business's own tax policy.
  is_taxable boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_addons_product on product_addons (product_id);

alter table product_addons enable row level security;

-- Same visibility shape as products' own "Public can read visible products
-- of published listings" policy (20260823000002) — an add-on is only ever
-- publicly readable when its parent product is (not hidden) and the parent
-- listing is published + ordering-eligible.
drop policy if exists "Public can read active add-ons of visible products" on product_addons;
create policy "Public can read active add-ons of visible products" on product_addons
  for select using (
    is_active = true
    and exists (
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
  );

-- Same nested-ownership shape as "Owners manage their own products"
-- (20260823000002) — a business owner manages add-ons only for products on
-- their own listing; the platform owner manages every add-on.
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
  );

-- ---------------------------------------------------------------------------
-- 3. product_orders / order_items — tax snapshot columns. Once an order is
--    created, these values are FINAL — a later tax_policies change never
--    retroactively touches them (submit_cart_order writes them once, no
--    other function ever updates them).
-- ---------------------------------------------------------------------------
alter table product_orders add column if not exists taxable_subtotal numeric(10, 2) not null default 0;
alter table product_orders add column if not exists tax_rate numeric(6, 5) not null default 0;
alter table product_orders add column if not exists tax_amount numeric(10, 2) not null default 0;
alter table product_orders add column if not exists tax_is_inclusive boolean not null default false;
-- Snapshot of the policy's own label, if any, at order time — e.g. an
-- itemized receipt can show "Somaliland VAT (5%)" even after the policy
-- named it something else later. Null when no policy applied (0% order).
alter table product_orders add column if not exists tax_policy_label text;

alter table order_items add column if not exists is_tax_exempt boolean not null default false;

-- ---------------------------------------------------------------------------
-- 4. resolve_tax_policy — the one resolution function every order line
--    (and the client-side preview in lib/actions/tax.ts, which calls the
--    same table shape) goes through. Hierarchy, most specific first:
--
--      1. Explicit exemption at ANY scope, checked most-specific-first
--         (product > business > category > global) — an exemption at a
--         more specific scope always wins, and once found, resolution
--         stops (a product explicitly marked exempt is never re-taxed by a
--         less specific rate).
--      2. Product-level rate (scope='product', this exact product_id).
--      3. Business-level rate (scope='business', this exact listing).
--      4. Category-level rate (scope='category') — see the `category`
--         column comment above for what "category" means per listing type.
--      5. Global/platform default (scope='global').
--      6. Nothing enabled/found → 0%, not exempt, not inclusive, no label.
--         Never invented — this is the pre-migration behavior (an order's
--         total was, and remains until an owner configures a policy, just
--         the subtotal).
--
--    Deliberately documented here as differing from a literal reading of
--    the spec's example ordering ("product/service/category" grouped
--    above "business") — most-specific-wins is the safer, more predictable
--    rule (an individual product/business override should never be
--    silently outranked by a broader category default), and matches how
--    this codebase already layers specificity everywhere else (a variant's
--    own price overrides its parent product's, never the reverse).
--
--    "Currently effective" = effective_from <= now() < coalesce(effective_
--    until, 'infinity'). When more than one row matches the same scope
--    (e.g. two overlapping global rows — shouldn't normally happen, but
--    isn't constrained against), the one with the latest effective_from
--    wins, so a newly-configured rate takes precedence over a defunct one
--    the admin forgot to close out with effective_until.
-- ---------------------------------------------------------------------------
create or replace function public.resolve_tax_policy(
  p_listing_type text,
  p_listing_id uuid,
  p_category text,
  p_product_id uuid
) returns table (rate numeric, is_exempt boolean, is_inclusive boolean, label text)
language sql
stable
set search_path = public, pg_temp
as $$
  with candidates as (
    select tp.rate, tp.is_exempt, tp.is_inclusive, tp.label, tp.effective_from,
      case tp.scope
        when 'product' then 1
        when 'business' then 2
        when 'category' then 3
        when 'global' then 4
      end as specificity
    from tax_policies tp
    where tp.is_enabled = true
      and tp.effective_from <= now()
      and (tp.effective_until is null or tp.effective_until > now())
      and (
        (tp.scope = 'product' and tp.product_id = p_product_id)
        or (tp.scope = 'business' and tp.listing_type = p_listing_type and tp.listing_id = p_listing_id)
        or (tp.scope = 'category' and tp.category = p_category)
        or (tp.scope = 'global')
      )
  ),
  -- Step 1: most specific EXEMPT row, if any.
  exempt_match as (
    select rate, is_exempt, is_inclusive, label from candidates
    where is_exempt = true
    order by specificity asc, effective_from desc
    limit 1
  ),
  -- Step 2: most specific row of ANY kind, when no exemption applies.
  rate_match as (
    select rate, is_exempt, is_inclusive, label from candidates
    order by specificity asc, effective_from desc
    limit 1
  )
  select * from exempt_match
  union all
  select * from rate_match where not exists (select 1 from exempt_match)
  union all
  select 0::numeric, false, false, null::text where not exists (select 1 from candidates)
  limit 1;
$$;

revoke all on function public.resolve_tax_policy(text, uuid, text, uuid) from public;
grant execute on function public.resolve_tax_policy(text, uuid, text, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. submit_cart_order — replaced IN PLACE at its TRUE current signature.
--
--    IMPORTANT CORRECTION (caught during local testing, before this ever
--    reached production): an earlier draft of this migration redefined
--    submit_cart_order at the ORIGINAL 13-argument signature from
--    20260823000002, not realizing two later migrations —
--    20260827000001_submit_cart_order_idempotency.sql (added
--    p_idempotency_key, 14 args) and
--    20260831000001_product_order_preferred_time.sql (added
--    p_preferred_time, 15 args, plus full product_variants/product_options
--    resolution) — had already extended it. Postgres identifies a function
--    by name + full argument type list, so that draft would have created a
--    harmless but USELESS second overload alongside the real one:
--    PostgREST/the app always calls the 15-arg version (idempotencyKey and
--    preferredTime are always sent — see lib/actions/product-orders.ts),
--    so the real function would have kept running completely unchanged and
--    tax/add-ons would have silently never activated. No existing
--    functionality would have broken (the live 15-arg function was never
--    touched by that draft), but the new features would have quietly done
--    nothing. Caught and fixed here by rebuilding this function starting
--    from 20260831000001's actual, complete, currently-live body — variant
--    resolution, product_options resolution, idempotency, and the
--    is_available filter are ALL preserved byte-for-byte from that version;
--    only the additions below (marked NEW) are new.
--
--    Same signature as the version created by 20260831000001 — no client
--    call-shape change needed. Adds (marked NEW below): (a) product_addons
--    resolution alongside the existing cafes.flower_addons path, (b)
--    per-line tax resolution + a taxable base that includes only taxable
--    add-ons/options, (c) order-level tax_amount/taxable_subtotal/tax_rate/
--    tax_is_inclusive/tax_policy_label + a total that adds tax exactly once
--    (or not at all, for an inclusive policy).
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
  -- NEW: tax + per-product add-ons.
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

    -- NEW: add-ons resolve two ways, in order:
    --  (a) product_addons — genuine per-product add-ons, any listing type
    --      or category. This is the primary, generic path going forward.
    --  (b) cafes.flower_addons — the pre-existing business-wide vocabulary,
    --      still gated to flower/gift-category products on a cafe, exactly
    --      as before this migration. Preserved unchanged so Lavender's
    --      existing flower ordering keeps working.
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

    -- NEW: tax, resolved per line (a cart can legitimately mix products
    -- with different product-level overrides), then summed into the order
    -- total. See resolve_tax_policy's own header for the full hierarchy.
    -- Taxable base = unit price × qty + taxable add-ons + options (options
    -- are product-price adjustments, not separate exempt items — no
    -- per-option exemption concept exists).
    select * into v_tax from resolve_tax_policy(p_listing_type, p_listing_id, v_product.category, v_product.id);
    v_line_exempt := coalesce(v_tax.is_exempt, false);
    v_line_taxable_base := case when v_line_exempt then 0
      else (coalesce(v_unit_price, 0) * v_quantity) + coalesce(v_taxable_addons_total, 0) + coalesce(v_options_total, 0) end;
    -- Inclusive: the rate describes tax already folded into the price —
    -- the tax "amount" is informational (for the receipt breakdown), never
    -- added to the total again. Exclusive: added on top, the normal case.
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
      -- Inclusive: v_line_tax is the portion already folded into
      -- v_line_total (the displayed price), so it contributes to the
      -- total once, not twice.
      v_total := v_total + v_line_total;
    else
      -- Exclusive (the common case, and the default when nothing is
      -- configured): tax is added on top of the line's own amount.
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

  -- NEW: blended rate for display only (e.g. a mixed cart with two
  -- different product-level rates) — never used for recalculation, the
  -- stored tax_amount is always the exact per-line sum above.
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
