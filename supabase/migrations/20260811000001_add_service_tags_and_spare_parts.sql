-- ============================================================================
-- Go Hargeisa — Services-offered tags for Beauty Salons / Men's Barbershops /
-- Auto Repair & Services + Spare Parts as a product category
--
-- Beauty Salons, Men's Barbershops, and Auto Repair & Services already exist
-- as active city_services categories (20260808000006/20260808000001-3) — no
-- new category rows or city_service_category enum values are needed here.
-- What was missing is a real, functional subcategory mechanism: their
-- requested subcategories (Hair Services, Beard & Shaving, Engine Repair,
-- ...) are SERVICES a business performs, not products it sells, so unlike
-- Cosmetics & Women's Beauty (products.category) the right shared mechanism
-- is a new `service_tags` text[] column — the exact same shape as the
-- existing `amenities_v2` column (see 20260803000016_city_services_upgrade.sql),
-- just a different, admin/owner-selectable vocabulary. See
-- lib/config/service-tags.ts for the fixed per-category vocabulary and
-- components/admin/service-tags-picker.tsx / components/shared/
-- service-tags-section.tsx for the picker/display, both modeled directly on
-- the amenities_v2 picker/display pair.
--
-- Also added to `business_join_requests` so a business owner can select
-- their services at signup time (mirrors how `custom_fields` was added
-- there in 20260807000004) and carried through to the listing on conversion
-- (lib/actions/business-requests.ts).
--
-- Spare Parts is kept out of `service_tags` on purpose (per explicit
-- request to keep it distinct from the repair-services subcategories) and
-- added instead to the Phase 4A Products Engine's shared `products.category`
-- vocabulary (20260810000001_products_engine.sql) — auto-repair gets
-- supports_products=true so a shop can list actual parts for sale,
-- following the exact same pattern already used for perfume-shop and
-- cosmetics-beauty.
--
-- Safe to re-run (if-not-exists column adds, idempotent constraint replace,
-- scoped update).
-- ============================================================================

alter table city_services add column if not exists service_tags text[] not null default '{}';
alter table business_join_requests add column if not exists service_tags text[] not null default '{}';

alter table products drop constraint if exists products_category_check;
alter table products add constraint products_category_check check (category in (
  'perfume', 'oud', 'bakhoor', 'attar', 'body_mist', 'cosmetics', 'makeup',
  'body_care', 'hair_care', 'gift_sets', 'accessories',
  'skincare_creams', 'hair_extensions_wigs', 'perfumes_fragrances', 'bath_body',
  'nail_care', 'beauty_tools_accessories', 'womens_personal_care',
  'spare_parts'
));

update categories set supports_products = true where slug = 'auto-repair';
