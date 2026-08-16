-- ============================================================================
-- Go Hargeisa — Flower Shops: display labels + gallery support
--
-- Renames the "flower-shops" category from "Flowers & Gifts" back to
-- "Flower Shops" (EN/AR/SO) per current direction, and turns on
-- supports_gallery so the category's dedicated photo-gallery section
-- (app/[locale]/city-services/[slug]/page.tsx) renders for it, matching the
-- other visual/product-heavy categories (e.g. Cosmetics & Women's Beauty).
-- Purely additive — no rows added or removed, no other category touched.
-- ============================================================================

update categories
set
  name = 'Flower Shops',
  name_ar = 'محلات الزهور',
  name_so = 'Dukaamada Ubaxa',
  supports_gallery = true
where slug = 'flower-shops';
