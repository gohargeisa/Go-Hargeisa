-- ============================================================================
-- Go Hargeisa — Phase 4A: Catalog/Product Engine (Perfume & Cosmetics shops)
--
-- Adds a polymorphic `products` table (listing_type/listing_id, same pattern
-- already used by reviews/business_metric_events/business_messages) so it
-- can be reused by Supermarket later with zero schema rework — but this
-- migration only wires it up for city_services (Perfume & Cosmetics shops
-- specifically, via the new categories.supports_products flag). No
-- Supermarket store entity is created here.
--
-- RLS mirrors the existing hotel_rooms/bookings pattern exactly: public read
-- of non-hidden products on published parent listings, owner access via a
-- join back to city_services.owner_id (same shape as hotel_rooms -> hotels),
-- admin unconditional access.
--
-- No existing table is altered except categories, which only gains one new
-- nullable-safe boolean column (default false) — no existing row's behavior
-- changes anywhere until explicitly flipped for perfume-shop below.
-- Idempotent (if not exists / drop-if-exists-before-create throughout),
-- safe to re-run.
-- ============================================================================

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  listing_type text not null default 'city_service',
  listing_id uuid not null,
  name text not null,
  name_ar text,
  name_so text,
  description text,
  description_ar text,
  description_so text,
  brand text,
  category text check (category in (
    'perfume', 'oud', 'bakhoor', 'attar', 'body_mist', 'cosmetics', 'makeup',
    'body_care', 'hair_care', 'gift_sets', 'accessories'
  )),
  gender text check (gender in ('men', 'women', 'unisex', 'kids')),
  price numeric(10, 2),
  currency text not null default 'USD',
  image text,
  gallery jsonb not null default '[]',
  is_available boolean not null default true,
  is_featured boolean not null default false,
  is_hidden boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_listing on products (listing_type, listing_id);

alter table products enable row level security;

drop policy if exists "Public can read visible products of published listings" on products;
create policy "Public can read visible products of published listings" on products
  for select
  using (
    is_hidden = false
    and listing_type = 'city_service'
    and exists (select 1 from city_services cs where cs.id = products.listing_id and cs.status = 'published')
  );

drop policy if exists "Owners manage their own products" on products;
create policy "Owners manage their own products" on products
  for all
  using (
    listing_type = 'city_service'
    and exists (select 1 from city_services cs where cs.id = products.listing_id and cs.owner_id = auth.uid())
  )
  with check (
    listing_type = 'city_service'
    and exists (select 1 from city_services cs where cs.id = products.listing_id and cs.owner_id = auth.uid())
  );

drop policy if exists "Platform admin manages all products" on products;
create policy "Platform admin manages all products" on products
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

alter table categories add column if not exists supports_products boolean not null default false;

-- Verified live 2026-08-10: 'perfume-shop' is the single active category row for Perfume & Cosmetics shops.
update categories set supports_products = true where slug = 'perfume-shop';
