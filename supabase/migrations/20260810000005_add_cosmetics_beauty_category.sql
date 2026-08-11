-- ============================================================================
-- Go Hargeisa — Add "Cosmetics & Women's Beauty" City Services category
--
-- New main category, requested to sit inside City Services alongside
-- Hospitals/Pharmacies/Beauty Salons/etc — target_table='city_services',
-- is_pinned=false (grouped under the single City Services nav entry, same
-- as every other sub-category, per getCityServiceCategories()). sort_order
-- 130 continues right after Men's Barbershops (129, the highest existing
-- city_services sort_order as of 20260808000006).
--
-- supports_products=true wires it into the Phase 4A Catalog/Product Engine
-- (20260810000001_products_engine.sql) — the exact same generic, DB-driven
-- products table + owner UI (components/business/products-manager.tsx) +
-- public filterable catalog (components/shared/products-section.tsx)
-- already built for Perfume & Cosmetics shops (perfume-shop). This is what
-- makes the requested subcategories (Skincare & Creams, Makeup, Hair Care,
-- Hair Extensions & Wigs, Perfumes & Fragrances, Body Care, Bath & Body,
-- Nail Care, Beauty Tools & Accessories, Women's Personal Care) actually
-- functional — a real per-product field owners set and shoppers filter by —
-- rather than a second, disconnected taxonomy. perfume-shop itself is left
-- completely untouched (its own category row, own existing product values).
--
-- schema_org_type 'HealthAndBeautyBusiness' is the schema.org LocalBusiness
-- subtype that actually covers cosmetics/beauty retail (no dedicated
-- "CosmeticsStore" type exists in schema.org), consistent with schema_org_type
-- usage on every other category row.
--
-- Safe to re-run (insert is idempotent via on conflict; constraint
-- drop/re-add is a plain DDL replace, not data-dependent).
-- ============================================================================

insert into categories (
  slug, name, name_ar, name_so, icon, color, target_table, is_active, is_pinned,
  sort_order, supports_gallery, supports_new_features, schema_org_type, supports_products
)
values (
  'cosmetics-beauty',
  'Cosmetics & Women''s Beauty',
  'مستحضرات التجميل والعناية النسائية',
  'Alaabta Qurxinta iyo Daryeelka Dumarka',
  'Sparkles',
  '#D946EF',
  'city_services',
  true,
  false,
  130,
  true,
  true,
  'HealthAndBeautyBusiness',
  true
)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- Extend the shared products.category vocabulary with the requested
-- Cosmetics & Women's Beauty subcategories. 'makeup', 'hair_care', and
-- 'body_care' already exist (added for perfume-shop) with labels that match
-- the request word-for-word, so they're reused as-is rather than duplicated
-- — see lib/config/product-categories.ts. The other 7 have no existing
-- equivalent (or would require relabeling a value perfume-shop already
-- displays, which the request says not to touch), so they're added new.
-- ----------------------------------------------------------------------------
alter table products drop constraint if exists products_category_check;
alter table products add constraint products_category_check check (category in (
  'perfume', 'oud', 'bakhoor', 'attar', 'body_mist', 'cosmetics', 'makeup',
  'body_care', 'hair_care', 'gift_sets', 'accessories',
  'skincare_creams', 'hair_extensions_wigs', 'perfumes_fragrances', 'bath_body',
  'nail_care', 'beauty_tools_accessories', 'womens_personal_care'
));
