-- ============================================================================
-- Go Hargeisa — Pinnacle Perfumes & Cosmetics: image audit + hide unverified
--
-- Every one of the 213 products' image URLs was individually re-checked
-- (HTTP status + byte size) against the live pinnacleperfumes.com source.
-- 21 resolved (HTTP 200) to Odoo's own generic "no image" placeholder
-- graphic (a 7,322-byte or 6,078-byte stock icon, confirmed byte-for-byte —
-- same known class of issue already documented on the existing dkny.com/
-- fragrancemarket.com entries in next.config.mjs), not a real photo — a
-- data gap on the source site itself, not a broken link.
--
-- Of those 21:
--   - 6 got a real, verified replacement photo, each individually
--     cross-checked by brand + product name + concentration + size against
--     an official brand site or a major authorized retailer (never a
--     different variant/concentration of the same fragrance line):
--       Calvin Klein CK One EDT 100ML          -> fragrancemarket.com
--       DKNY Be 100% Delicious EDP 100ML/50ML  -> perfumeonline.com
--         (DKNY's own official site no longer sells this discontinued line)
--       Lancome Tresor Midnight Rose EDP 75ML  -> fragrancemarket.com
--       Michael Kors Sexy Amber EDP 100ML      -> caretobeauty.com
--       Ralph Lauren Ralph's Club EDP 50ML     -> caretobeauty.com
--         (same fragrance/bottle design as the site's own 100ml listing;
--         no dedicated 50ml photo could be found)
--   - 15 could not be matched to any verified real photo within reasonable
--     effort (6 Ralph Lauren niche/newer concentrations, 3 Thierry Mugler
--     Alien Goddess Intense/Alien Man, 6 Van Cleef & Arpels Collection
--     Extraordinaire niche fragrances — several genuinely discontinued or
--     carried by no retailer this pass could verify). Per explicit
--     instruction, these are hidden from the public storefront
--     (is_hidden = true) rather than shown with a placeholder or a
--     guessed/mismatched image. NOT deleted — the row, its real name,
--     brand, size, and internally-retained price all remain intact for
--     admin use, and re-appear automatically the moment a verified image
--     is added and is_hidden is flipped back.
--
-- Purely corrective, safe to re-run (every statement is an idempotent
-- UPDATE by primary key).
-- ============================================================================

-- 6 verified image replacements
update products set image = 'https://fragrancemarket.com/cdn/shop/products/Calvin-Klein-Ck-One-Womens-Eau-de-Toilette-Spray-1.7-Best-Price-Fragrance-Parfume-Details.jpg?v=1773158329&width=1946' where id = 'df2a5496-9e7b-4a19-aca4-df58ef8fb1e4';
update products set image = 'https://perfumeonline.com/cdn/shop/files/DKNY-Be-Delicious-100_1024x1024.jpg?v=1768860796' where id = '045b326a-1344-4eae-aded-9b37c3c0c6fd';
update products set image = 'https://perfumeonline.com/cdn/shop/files/DKNY-Be-Delicious-100_1024x1024.jpg?v=1768860796' where id = '0ec8690d-6cf4-4669-aaa7-0bd173bf003e';
update products set image = 'https://fragrancemarket.com/cdn/shop/products/Lancome-Tresor-Midnight-Rose-Womens-Eau-De-Parfum-EDP-Spray-2.5-oz.-Best-Price-Fragrance-Parfume-FragranceOutlet.com-MAIN.jpg?v=1568962286' where id = '796b5e24-080e-4062-bf1b-2548407e7bf8';
update products set image = 'https://www.caretobeauty.com/cdn-cgi/image/width=1600,height=1600,f=auto/media/catalog/product//m/i/michael-kors-sexy-amber-eau-de-parfum-100ml_1.jpg' where id = '6c6decde-4b21-4158-9159-401c40c879dd';
update products set image = 'https://www.caretobeauty.com/cdn-cgi/image/width=1600,height=1600,f=auto/media/catalog/product//r/a/ralph-lauren-ralph-s-club-eau-de-parfum-for-men-100ml.jpg' where id = 'a0409b28-c068-45e0-8595-fb0c2a5cf5ff';

-- 15 hidden from the public storefront (kept in the database, is_hidden = true)
update products set is_hidden = true where id in (
  '55df9420-45bc-43ff-b23a-ddd51146004c', -- Ralph Lauren Polo Blue Parfum, 75ML
  '73da431e-dd67-432b-808d-3f2afec7f4aa', -- Ralph Lauren Polo Deep Blue Parfum, 75ML
  '0b50372e-e781-433c-bed1-de04b6a2e174', -- Ralph Lauren Polo Red EDP, 75ML
  '8b91149d-6b4f-47b7-b6ca-85cf1383f143', -- Ralph Lauren Polo Red EDT, 125ML
  '3eb6fb9d-db32-44fe-a1aa-b17e605eb93a', -- Ralph Lauren Ralph's Club Parfum, 50ML
  'c631e755-e702-42da-952c-d5fe24ce6993', -- Ralph Lauren Safari For Men EDT, 125ML
  '1c0b0033-dd7b-43a7-8d52-18f2a9f3c14b', -- Thierry Mugler Alien Goddess EDP Intense, 60ML
  '64e9c583-1492-4b36-a0bd-8425d8483f06', -- Thierry Mugler Alien Goddess EDP Intense, 90ML
  '29ed5a76-49ab-4b63-b840-cb8a5a5f1e5c', -- Thierry Mugler Alien Man EDT, 100ML
  '135185c5-c283-4dde-accc-536099dc0304', -- VCA Ambre Impérial EDP Natural Spray, 75 ml
  'af2ec135-f13c-4d6f-a12f-038b2eb272ba', -- VCA Bois D'Iris EDP Natural Spray, 75 ml
  '95d72af3-f7ab-4635-a41d-3c6473e0188e', -- VCA Bois Doré EDP Natural Spray, 75 ml
  '7cc0bd08-d412-496a-b86a-5edba8411c0c', -- VCA Moonlight Patchouli EDP Natural Spray, 75 ml
  '4a34870d-b632-499f-8589-5a22de14e8dc', -- VCA Precious Oud EDP Natural Spray, 75 ml
  '203c834a-fa8a-4a02-a653-a1ab0b3e8df6'  -- VCA Rose Rouge EDP Natural Spray, 75 ml
);
