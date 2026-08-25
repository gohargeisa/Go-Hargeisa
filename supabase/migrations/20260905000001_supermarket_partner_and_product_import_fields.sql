-- ============================================================================
-- Go Hargeisa — Supermarket partner support + product import provenance
--
-- Two independent, purely additive changes, both extending the EXISTING
-- city_services + products system (see 20260810000001_products_engine.sql's
-- own header: "so it can be reused by Supermarket later with zero schema
-- rework") rather than building the separate supermarket_* schema sketched
-- in docs/supermarket-architecture.md — that plan predates the products/
-- cart engine that now already exists and is proven live (Flormar,
-- Lavender Flowers, Pinnacle). No new tables, no new listing_type value.
--
-- 1. Activates the categories row already sitting dormant for exactly this
--    (slug='supermarket', target_table='city_services', found already
--    present but is_active=false, supports_products=false — created ahead
--    of time in an earlier category-cleanup pass, never wired up). Flipping
--    both flags is the entire "add a Supermarket vertical" schema change;
--    every other supermarket that joins later reuses the same row, same as
--    'perfume-shop' already does for Pinnacle/Flormar.
--
-- 2. Adds import-provenance + a few real supermarket-shaped product fields,
--    all nullable — every existing product (perfume/flower/café-menu, none
--    of which came from an external catalog) is completely unaffected:
--      - external_product_id / external_source: lets a future CSV/JSON/API
--        import reconcile "already imported" vs "new" without relying on
--        name/price (which can legitimately change at the source).
--      - last_synced_at: when this row was last refreshed from that source.
--      - sale_price: the discounted price, when the source has one (price
--        stays the original/regular price — same "current vs was" shape
--        already used elsewhere on the site, e.g. offers.discount_price).
--      - size / unit: e.g. "1" / "kg", "500" / "ml" — separate columns so a
--        future filter/sort can group by unit without parsing free text.
--    A partial unique index enforces the actual idempotency guarantee: a
--    second import run with the same (listing, source, external id) updates
--    the existing row instead of inserting a duplicate.
-- ============================================================================

update categories
set is_active = true, supports_products = true
where slug = 'supermarket' and target_table = 'city_services';

alter table products add column if not exists external_product_id text;
alter table products add column if not exists external_source text;
alter table products add column if not exists last_synced_at timestamptz;
alter table products add column if not exists sale_price numeric(10, 2);
alter table products add column if not exists size text;
alter table products add column if not exists unit text;

comment on column products.external_product_id is 'Stable ID from an external catalog source (e.g. a supplier''s own product ID) — used to reconcile re-imports. Null for every product entered directly in Go Hargeisa.';
comment on column products.external_source is 'Which external system external_product_id refers to, e.g. ''waafi_market''. Null unless external_product_id is set.';
comment on column products.last_synced_at is 'When this row was last refreshed from its external_source. Null for products never imported from an external source.';
comment on column products.sale_price is 'Discounted price, when the source/owner has set one. products.price stays the regular/original price; sale_price is only shown as a markdown when lower than price.';

create unique index if not exists idx_products_external_source_id
  on products (listing_type, listing_id, external_source, external_product_id)
  where external_product_id is not null and external_source is not null;
