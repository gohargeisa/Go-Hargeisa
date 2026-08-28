-- ============================================================================
-- Go Hargeisa — The Village Hargeisa: reconcile the live menu against the
-- new authoritative source "The_Village_Hargeisa_Menu.xlsx" (48 items across
-- 8 categories, cross-checked row by row against the existing 60-product
-- catalog). This migration only touches naming/category-string/structure
-- issues where the Excel's own text differs from what's already stored —
-- no price was changed anywhere (every price in the Excel already matched
-- the live price exactly), and nothing was invented.
--
-- The 12 "The Village Specials" products (Sweet and Sour Crispy Chicken,
-- Butter Chicken, Grilled Chicken, Pepper Steak, Fajita, Grilled Shrimps
-- 200g, Haneed Lamb, Daud Basha, Shaya Steak, Grilled Fish, Curry Fish,
-- Fried Finger Fish) are NOT in this Excel at all. Left completely
-- untouched here, per the "never delete/alter data absent from a new
-- source without an explicit instruction" rule already established for
-- this codebase's other partner-menu imports — flagged in the fix report
-- for the owner's decision, not silently removed or silently kept as if
-- Excel-verified.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Category name -> exact Excel text (cosmetic string only; same products,
--    same category grouping, just matching the new source's own spelling).
-- ----------------------------------------------------------------------------
update products
set category = 'Saj-Shawarma & Sandwiches'
where listing_type = 'restaurant'
  and listing_id = '2237bbdf-4f24-494e-b7e0-b90b58e8c39f'
  and category = 'Saj — Shawarma & Sandwiches';

update products
set category = 'Grills (Mediterranean BBQ)'
where listing_type = 'restaurant'
  and listing_id = '2237bbdf-4f24-494e-b7e0-b90b58e8c39f'
  and category = 'Grills — Mediterranean BBQ';

-- ----------------------------------------------------------------------------
-- 2. Product name -> exact Excel text. Each of these is a spelling/character
--    difference between what was already live and the Excel's own "Item"
--    column text (the new authoritative source) — not a new name being
--    invented.
-- ----------------------------------------------------------------------------
update products set name = 'Zait & Za''atar' where id = '2cac4bc4-9c45-400b-a82c-f171c8389283'; -- was "Zait a Za'atar"
update products set name = 'Mukhalal (Pickled Vegetables)' where id = '65c806ea-0e3d-4e38-ab58-560b10134aae'; -- was "Mukhallal" (double L)
update products set name = 'Beef Stir Fry (Suqar)' where id = '61d55576-c612-447e-996e-3f0f70c116fd'; -- was "(Suqaar)" — Excel spells it "Suqar"
update products set name = 'Shiish Kebab' where id = '9387d42b-b735-4950-9a55-f433a3310930'; -- was "Shish Kebab"
update products set name = 'Shiish Tawooq' where id = '3e9e7276-6ec5-438d-af14-3d29efb19a33'; -- was "Shish Tawooq"
update products set name = 'Kebab-Khashkhash' where id = '1dfbb790-eb7b-4aef-a06f-38a3c3f828e4'; -- was "Kebab-Khashkash"
update products set name = 'Margarita' where id = '96644dd4-6c82-4346-a437-74882db0868c'; -- was "Margherita" — Excel's own spelling is "Margarita"
update products set name = 'Penna Arabiata' where id = 'ac94ae26-b643-416d-8499-218bff87c75f'; -- was "Penne Arabiata"

-- ----------------------------------------------------------------------------
-- 3. Mixed Grill: the Excel lists "Mixed Grill (Medium) $14" / "Mixed Grill
--    (Large) $21" as one dish at two sizes, not two unrelated products —
--    matching every other sized item on this menu (pizza), which is already
--    modeled as one product + a `product_options` "Size" choice, not
--    separate product rows. Neither of the two existing rows has ever been
--    ordered (0 rows in order_items) and neither has any variant/option/
--    addon/tax_policy row of its own, so merging is safe.
--    Medium (id b0365809-...) survives as the base product, renamed to
--    match the Excel's own name ("Mixed Grill"); Large (id 7baeeeff-...) is
--    removed and re-expressed as the "Large" choice on a new Size option,
--    mirroring the exact `choices` shape already used for pizza sizing.
-- ----------------------------------------------------------------------------
update products
set name = 'Mixed Grill'
where id = 'b0365809-5040-42cd-86fe-4a1d090cd950';

delete from products where id = '7baeeeff-924b-433f-a5ea-8fcf25b85603';

insert into product_options (product_id, key, label, type, required, price_delta, choices, sort_order)
values (
  'b0365809-5040-42cd-86fe-4a1d090cd950',
  'size',
  'Size',
  'select',
  true,
  0,
  '[{"label":"Medium","value":"medium","priceDelta":0},{"label":"Large","value":"large","priceDelta":7}]'::jsonb,
  0
);

-- Defensive self-check: 47 Excel-sourced products remain (60 total, minus
-- the 12 untouched "The Village Specials", minus 1 for the Mixed Grill
-- Medium+Large merge down to a single product), and the merge's Size
-- option was actually created.
do $$
declare
  excel_scope_count int;
  mixed_grill_option_count int;
begin
  select count(*) into excel_scope_count
  from products
  where listing_type = 'restaurant'
    and listing_id = '2237bbdf-4f24-494e-b7e0-b90b58e8c39f'
    and category <> 'The Village Specials';

  if excel_scope_count != 47 then
    raise exception 'Expected 47 Excel-scoped Village products, found %', excel_scope_count;
  end if;

  select count(*) into mixed_grill_option_count
  from product_options
  where product_id = 'b0365809-5040-42cd-86fe-4a1d090cd950' and key = 'size';

  if mixed_grill_option_count != 1 then
    raise exception 'Expected exactly 1 Size option on the merged Mixed Grill product, found %', mixed_grill_option_count;
  end if;
end $$;
