-- ============================================================================
-- Go Hargeisa — Lavender Café: reconcile menu against the approved Excel
-- (Lavender_Cafe_Menu_Corrected_Section_Prices.xlsx, 63 rows) against the
-- 106 products already live in production.
--
-- Reconciliation performed (see conversation for the full row-by-row diff):
--   - 43 Excel rows matched an existing product by name.
--   - 13 of those matches had a null DB price where the Excel gives a clean,
--     confirmed section price (Price Basis = "Section price") — filled in
--     below. No existing non-null price was overwritten.
--   - 2 matches (Waffles, Crepe) show a conflicting Excel value ($1) but
--     under the spreadsheet's own unconfirmed "Section/item label" tier —
--     NOT applied; existing $4.50 values left untouched pending owner
--     confirmation.
--   - 6 Excel rows had no existing match, a confirmed price, and a
--     confirmed (unflagged) name — inserted below as new products.
--   - 10 Excel rows with an uncertain/flagged name and 4 rows with no price
--     at all (2 real category-placeholder rows + 1 stray section label +
--     1 duplicate row) are explicitly NOT included in this migration,
--     pending owner verification.
--   - The 63 existing products with no Excel counterpart are untouched —
--     nothing was deleted.
--
-- Purely corrective/additive, safe to re-run (updates are idempotent by
-- primary key; inserts use a WHERE NOT EXISTS guard).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 13 price corrections: fill in a currently-null price with the Excel's
-- confirmed section price.
-- ----------------------------------------------------------------------------
update products set price = 2.00 where id in (
  '8d4b5f8a-e808-47b6-83df-97c1639beaa2', -- Cappuccino
  'a111bf07-7101-41a8-bfdf-1fede8255df9', -- Latte
  '269ce3c4-27ff-4548-82ec-34fc24f5d9c4', -- Spanish Latte
  '2ab17e5b-a3d7-419e-935a-d0329b106f62', -- Americano
  '20a616b7-b506-4dcb-b881-86cd4b47f803', -- Flat White
  '2df39220-1a8e-4f1a-b8ea-72441507b5aa', -- Caramel Macchiato
  '79c6274f-fb9d-4c22-91cf-3a66f7dab4dd', -- Vanilla Latte
  '0fdd8f87-4fc7-4b2d-9258-277488fc5a6c'  -- Mocha Coffee
);

update products set price = 3.00 where id in (
  '2cdfedd4-b7b6-4d72-b4ab-e17b743c5a74', -- Mango Smoothie
  'dfe6a73b-3c77-4c6a-8ab4-1433228fd594', -- Pistachio Smoothie
  '97d926bd-0371-4992-a5ed-81bfedd586b1', -- Passion Smoothie
  '8d528cb4-a307-46d0-8eae-c7fc40dfab8b', -- Raspberry Smoothie
  '73d3c30d-dc6a-44da-9063-ff3a74ac673c'  -- Blueberry Smoothie
);

-- ----------------------------------------------------------------------------
-- 6 new products: confirmed name, confirmed price, no existing match.
-- category left null, matching every existing Lavender Café product (the
-- storefront does not group this listing by the products.category enum).
-- ----------------------------------------------------------------------------
insert into products (listing_type, listing_id, name, price, currency, is_available, is_hidden, sort_order)
select v.listing_type, v.listing_id::uuid, v.name, v.price, 'USD', true, false, v.sort_order
from (values
  ('cafe', '0bb4fea0-d93a-48a8-9145-755e91378f5a', 'Espresso', 2.00, 206),
  ('cafe', '0bb4fea0-d93a-48a8-9145-755e91378f5a', 'Hazelnut Latte', 2.00, 207),
  ('cafe', '0bb4fea0-d93a-48a8-9145-755e91378f5a', 'Pineapple Smoothie', 3.00, 208),
  ('cafe', '0bb4fea0-d93a-48a8-9145-755e91378f5a', 'Caramel Milkshake', 3.00, 209),
  ('cafe', '0bb4fea0-d93a-48a8-9145-755e91378f5a', 'Pistachio Milkshake', 3.00, 210),
  ('cafe', '0bb4fea0-d93a-48a8-9145-755e91378f5a', 'Hungry Burger', 2.00, 211)
) as v(listing_type, listing_id, name, price, sort_order)
where not exists (
  select 1 from products p
  where p.listing_type = v.listing_type and p.listing_id = v.listing_id::uuid and p.name = v.name
);
