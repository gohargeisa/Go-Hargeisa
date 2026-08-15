-- ============================================================================
-- Go Hargeisa — Flowers & Gifts: rename + product cards
--
-- 1. Relabels the "flower-shops" category (target_table='services') from
--    "Flower Shops" to "Flowers & Gifts" — the category already captures
--    gift-related fields (gift_wrapping, custom_bouquets, event_decoration,
--    etc. from 20260811000006), so this is a display-name correction, not a
--    new category. No new category row (a separate empty "Gift Shops" row
--    was considered and deliberately not created — no gift-shop-specific
--    data exists anywhere yet).
--
-- 2. Widens the products engine's RLS (previously city_services-only, see
--    20260810000001_products_engine.sql) to also recognize
--    listing_type='service', mirroring the exact same public-read /
--    owner-manage / admin-manage shape already used for city_services
--    products. Existing city_service policies/rows/behavior are completely
--    unchanged — this only adds the 'service' branch alongside them.
--
-- 3. Flips supports_products for flower-shops so a real flower/gift shop can
--    optionally list bouquet/gift products the same way perfume-shop and
--    cosmetics-beauty already do. No product rows are created — no real
--    flower shop has product data today (services table is empty).
-- ============================================================================

update categories
set name = 'Flowers & Gifts', name_ar = 'زهور وهدايا', name_so = 'Ubax iyo Hadyado'
where slug = 'flower-shops';

drop policy if exists "Public can read visible products of published listings" on products;
create policy "Public can read visible products of published listings" on products
  for select
  using (
    is_hidden = false
    and (
      (listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = products.listing_id and cs.status = 'published'))
      or
      (listing_type = 'service' and exists (select 1 from services s where s.id = products.listing_id and s.status = 'published'))
    )
  );

drop policy if exists "Owners manage their own products" on products;
create policy "Owners manage their own products" on products
  for all
  using (
    (listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = products.listing_id and cs.owner_id = auth.uid()))
    or
    (listing_type = 'service' and exists (select 1 from services s where s.id = products.listing_id and s.owner_id = auth.uid()))
  )
  with check (
    (listing_type = 'city_service' and exists (select 1 from city_services cs where cs.id = products.listing_id and cs.owner_id = auth.uid()))
    or
    (listing_type = 'service' and exists (select 1 from services s where s.id = products.listing_id and s.owner_id = auth.uid()))
  );

update categories set supports_products = true where slug = 'flower-shops';
