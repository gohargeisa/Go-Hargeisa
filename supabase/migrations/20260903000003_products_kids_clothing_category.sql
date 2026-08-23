-- ============================================================================
-- Go Hargeisa — products.category: add 'kids_clothing'
--
-- Reusable, not partner-specific — the existing category vocabulary has no
-- value for children's clothing/footwear at all, even though "Kids &
-- Family" is already a real city_services category with real listings
-- (Mama Baby Care today, any future kids-retail partner tomorrow). Adding
-- one enum value the same way every prior category expansion in this file
-- has been added (see 20260810000005, 20260811000001, 20260818000002).
-- ============================================================================

alter table products drop constraint if exists products_category_check;
alter table products add constraint products_category_check check (category in (
  'perfume', 'oud', 'bakhoor', 'attar', 'body_mist', 'cosmetics', 'makeup',
  'body_care', 'hair_care', 'gift_sets', 'accessories',
  'skincare_creams', 'hair_extensions_wigs', 'perfumes_fragrances', 'bath_body',
  'nail_care', 'beauty_tools_accessories', 'womens_personal_care',
  'spare_parts',
  'bouquet', 'floral_arrangement', 'occasion_gift', 'plant', 'cake',
  'kids_clothing'
));
