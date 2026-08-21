-- ============================================================================
-- Go Hargeisa — Real split of Lavender Flowers / Lavender Café (Option 2)
--
-- PROPOSED ONLY. NOT YET APPLIED. Written for review per the project owner's
-- explicit request, 2026-08-19, following the read-only Lavender-split audit
-- and its data verification. Implements Option 2 (a real second listing),
-- exactly as reviewed and approved: no schema change, three statements only.
--
-- WHAT THIS DOES
--   1. Creates ONE new city_services row for "Lavender Flowers" under the
--      already-existing Flower Shops category (categories.slug='flower-shops',
--      id=eb8e16de-6cf3-4240-9f12-97ffc2a9ba6f, supports_products=true — no
--      category change needed, it already supports products/ordering).
--      Fixed id below (not gen_random_uuid()) so the new listing's id is
--      known and reviewable before this file is ever run.
--   2. Re-points exactly the 12 verified `category='bouquet'` product rows
--      from the café listing to the new Flowers listing. Scoped by both
--      listing_id AND category so it is structurally impossible for this
--      statement to touch any of the café's 106 category=NULL menu items.
--   3. Renames the existing cafes row to "Lavender Café" and flips
--      sells_flowers to false (it no longer sells flowers directly — the
--      new Flowers listing does).
--
-- WHAT THIS DELIBERATELY DOES NOT TOUCH
--   - product_orders / order_items — never referenced by any statement
--     below. All 3 real orders on this listing (ORD-2026-000005,
--     ORD-2026-000006, and the pending ORD-2026-000019 for "10 Roses")
--     keep listing_type='cafe', listing_id=0bb4fea0-... exactly as they are
--     today — snapshot fields (product_name/image/price) already make them
--     immune to any change in the live product rows regardless.
--   - The 106 café product rows — the UPDATE below is scoped to
--     category='bouquet' only; none of the 106 have that category value
--     (verified: all 106 are category IS NULL), so they cannot match.
--   - Any product column other than listing_type/listing_id — name, price,
--     image, description, is_available, is_hidden, sort_order all stay
--     exactly as they are on the 12 moved rows.
--   - The café's own description text (still mentions flowers in one
--     sentence) — deliberately left as-is; a cosmetic copy edit was marked
--     optional, not required, in the reviewed plan.
--   - Any other listing, product, category, or business on the platform.
--
-- SAFETY
--   Purely additive + two scoped UPDATEs. No DDL. No column/index/function
--   change. Rollback is the exact inverse of these three statements (see
--   scratchpad/rollback-lavender-split.sql, prepared alongside this file).
-- ============================================================================

insert into city_services (
  id, category, category_id, name, slug, status,
  description, phone, whatsapp, lat, lng, products_delivery_enabled, sort_order
) values (
  'b3a8e2f0-6c4d-4a1b-9e5f-7d2c8a9b6e10',
  'flower_shops',
  (select id from categories where slug = 'flower-shops'),
  'Lavender Flowers',
  'lavender',
  'published',
  'Lavender hand-crafts fresh rose bouquets, boxed arrangements, and gift flowers for every occasion, with delivery available across Hargeisa.',
  '⁦+252 63 8531422⁩',
  '⁦+252 63 8531422⁩',
  9.5649707,
  43.9980861,
  true,
  0
);

update products
set listing_type = 'city_service',
    listing_id = 'b3a8e2f0-6c4d-4a1b-9e5f-7d2c8a9b6e10'
where listing_type = 'cafe'
  and listing_id = '0bb4fea0-d93a-48a8-9145-755e91378f5a'
  and category = 'bouquet';

update cafes
set name = 'Lavender Café',
    sells_flowers = false
where id = '0bb4fea0-d93a-48a8-9145-755e91378f5a';
