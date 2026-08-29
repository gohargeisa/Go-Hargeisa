-- ============================================================================
-- Go Hargeisa — Lavender Café live-page audit fix.
--
-- Root cause of the reported "Waffles/Pudding/cakes under Hot Coffee" /
-- "Crepe under Tea" bug: app/[locale]/cafes/[slug]/page.tsx groups Lavender's
-- 112 café products into sections *positionally* (by sort_order, sliced by
-- fixed per-section counts — see lib/config/lavender-menu-sections.ts),
-- because products.category was NULL for all of them (the CHECK constraint
-- that used to reject café vocabulary blocked writing real category values
-- at insert time). That page ALSO filters out any Lavender product with no
-- image before doing the positional slicing. The moment any product in the
-- middle of a section has no image (true for 19 of the 112: all 12 Mojito
-- Mocktails, Iced Blueberry Matcha, and 6 later-added items), it's removed
-- from the sequence *before* slicing, which shifts every following product
-- into the wrong section — the two bugs compound instead of independently.
--
-- The real fix (already flagged as the intended follow-up in that same
-- config file's own header comment) is to backfill real category strings
-- now that the CHECK constraint has been dropped (verified separately via
-- `select conname from pg_constraint where conname = 'products_category_check'`
-- returning zero rows) and let the page group by the stored category
-- instead of by position. This is immune to future inserts/image changes by
-- construction — no more hand-counted positional buckets to keep in sync.
--
-- Every category value below matches scripts/add-lavender-menu-items.ts's
-- own SECTIONS arrays verbatim (that script's categories were themselves
-- transcribed directly from "Lavender Menu last.pdf"'s own section headers,
-- cross-checked line by line — not a new assumption made here). The only
-- products not covered by that script are the 6 rows added later by the
-- separate Excel-reconciliation migration (Espresso, Hazelnut Latte,
-- Pineapple Smoothie, Caramel Milkshake, Pistachio Milkshake, Hungry
-- Burger) — these are outside the PDF-verified 106/94-item scope, so their
-- category below is assigned by product-name inference (e.g. "Hazelnut
-- Latte" -> Hot Coffee) rather than a verified source, folding each into
-- its closest existing, real menu section instead of a meaningless
-- "Newly Added" placeholder label. Flagged in the fix report for owner
-- review, not deleted (per explicit instruction not to remove legacy rows
-- without a confirmed reason).
--
-- Purely corrective (UPDATE by primary key), safe to re-run.
-- ============================================================================

update products set category = 'Hot Drinks' where id in (
  '7f01d283-00b7-4464-aec8-b2000fec3613', -- Hot Chocolate
  'cc8aef4d-50da-4d0a-96df-54cf4a653f59', -- White Hot Chocolate
  'adcc0f41-0d23-4678-8ff9-0b0589601580', -- Retinol Juice
  '53e4ec5b-59e1-48af-b4f7-e3bce7a138a4'  -- Beetroot Blend
);

update products set category = 'Tea' where id in (
  'aa5ee502-b397-4fd2-80cc-c72d0f5d5a74', -- Green Tea
  'bcc5ce08-992b-4f72-b048-822e42ea183a', -- Mint Tea
  'b3049f0b-dabf-4df4-b6f0-70dbfb47acd6', -- Somali Tea
  '55e36b64-2b49-4ed3-8979-112cb3872949'  -- Dawa Tea
);

update products set category = 'Hot Coffee' where id in (
  'acfa9fe4-8247-4997-8508-e6ba53300f78', -- Espresso S/D
  '8d4b5f8a-e808-47b6-83df-97c1639beaa2', -- Cappuccino
  'a111bf07-7101-41a8-bfdf-1fede8255df9', -- Latte
  '269ce3c4-27ff-4548-82ec-34fc24f5d9c4', -- Spanish Latte
  '2ab17e5b-a3d7-419e-935a-d0329b106f62', -- Americano
  '20a616b7-b506-4dcb-b881-86cd4b47f803', -- Flat White
  '13cc2bf6-7b4f-4bc6-96ec-e1537e9dcdbd', -- Matcha White
  'b8433da6-eee4-4369-aa79-38a6b57f4208', -- Latte Macchiato
  '5565c7be-94de-417b-93b0-39540b9a6f2a', -- Espresso Bomb
  '2df39220-1a8e-4f1a-b8ea-72441507b5aa', -- Caramel Macchiato
  '79c6274f-fb9d-4c22-91cf-3a66f7dab4dd', -- Vanilla Latte
  'cdc02524-6600-4d05-8a0c-cb4bd8364038', -- Caramel Latte
  '0fdd8f87-4fc7-4b2d-9258-277488fc5a6c', -- Mocha Coffee
  '09c7a107-98db-498b-a110-9d4048233ee5', -- Espresso (unverified — see header note)
  'f50ac5d9-64f2-4f74-b12b-21a329f1c6ba'  -- Hazelnut Latte (unverified — see header note)
);

update products set category = 'Hot Matcha' where id in (
  '365c18a3-0f9f-46b1-a053-cec4649cc692', -- Matcha Latte
  '7ecd1193-c8c7-4b86-8131-28a8f1bbfc3e', -- Vanilla Matcha
  '9adb6c81-788b-420a-a7f8-db78778845bc'  -- Caramel Matcha
);

update products set category = 'Iced Matcha' where id in (
  '21022133-f95a-4dcd-b0d1-9c5b030af7bf', -- Iced Latte Matcha
  '74355366-73db-4c0e-a278-69fda884d88c', -- Iced Strawberry Matcha
  '95a4e884-c567-4d29-9dd1-a8d4cf0b17d3', -- Iced Vanilla Matcha
  '42f5191e-0452-4791-97fd-12159811760f'  -- Iced Blueberry Matcha (intentionally no image)
);

update products set category = 'Iced Coffee' where id in (
  'ef1a2dea-8dce-424b-9349-33100be6e2d1', -- Iced Latte
  '01054a27-3b6b-4f5b-96ec-fc898f641be2', -- Iced Americano
  'f2d439d7-6195-4ded-b2b1-2a743c6763ae', -- Iced Cappuccino
  '51bc6f67-8321-47f7-be3b-8bcec359da33', -- Iced Frappuccino
  '3e3bd70a-7d9a-4be5-8f58-f7b758b3d5d7', -- Iced Coffee
  '1744f630-7a0a-4a9e-993b-f9d971f792fd', -- Iced Mocha
  '7d6bf00e-ab40-4872-89ca-1dd8c030c356', -- Iced Caramel Latte
  '553d4bd6-a18f-4359-8a2f-3e433d7a7374'  -- Iced Vanilla Latte
);

update products set category = 'Smoothies' where id in (
  '2cdfedd4-b7b6-4d72-b4ab-e17b743c5a74', -- Mango Smoothie
  'c95d9ded-cb98-482a-adec-3d22cb429dc3', -- Banana Smoothie
  '0f0c5ae1-547a-4f8d-a942-ccbbb2a66cd0', -- Strawberry Smoothie
  'dfe6a73b-3c77-4c6a-8ab4-1433228fd594', -- Pistachio Smoothie
  '97d926bd-0371-4992-a5ed-81bfedd586b1', -- Passion Smoothie
  '8d528cb4-a307-46d0-8eae-c7fc40dfab8b', -- Raspberry Smoothie
  '73d3c30d-dc6a-44da-9063-ff3a74ac673c', -- Blueberry Smoothie
  '9028dd5b-0466-4fd5-bfcb-907206c37d87', -- Pineapple/Ananas Smoothie
  '22ea4c5d-be8a-46dc-bac9-21d01f057657'  -- Pineapple Smoothie (unverified — possible near-dup of Pineapple/Ananas, see header note; not deleted)
);

update products set category = 'Milkshakes' where id in (
  'f1459377-eaf7-420f-ba12-864657cfd3eb', -- Blueberry Milkshake
  '16ebe327-43f4-4fbb-86cb-436fbd908181', -- Vanilla Milkshake
  '868e724d-00d1-482d-a955-aeeee11ed793', -- Strawberry Milkshake
  '4b99545e-f4d2-4965-86a7-23a540bfcc50', -- Chocolate Milkshake
  'f7832e71-c20c-4252-9277-cb9b25051636', -- Oreo Milkshake
  '3c67df5a-b2a9-4cd7-8a84-b65485a2e0a8', -- Lotus Milkshake
  '2af41ecb-a740-4a60-a3e8-c708282a016a', -- Raspberry Milkshake
  '74f37226-482f-4e4d-ad35-d4a12a34fa7e', -- Espresso Milkshake
  'e10ff5d3-1a20-4f0a-92a9-ac3c11d1b74b', -- Mocha Milkshake
  '4139bc87-0c5d-498f-8786-562ba42019f2', -- Mixed Milkshake
  'c214aee6-d11e-4671-8812-f8a7e736b1c5', -- Passion Milkshake
  '7935eb6f-2694-4458-834f-868c75bcaa94', -- Mango Milkshake
  '62e800aa-cc83-4888-81d1-c9d091d119d0', -- Caramel Milkshake (unverified — see header note)
  'df34f677-820e-43e5-9366-c21c07150394'  -- Pistachio Milkshake (unverified — see header note)
);

update products set category = 'Mojito Mocktails' where id in (
  '5335f91c-58f2-4d62-b20f-da22e0b9bd9c', -- Blueberry Mojito Mocktail
  '643f0dc8-3562-46b0-b62d-7a9e4e44c3eb', -- Vanilla Mojito Mocktail
  'b9ed4286-3edd-4961-b472-a88a26e3b891', -- Strawberry Mojito Mocktail
  '0aad6708-6aab-4b7f-b548-87927cd8615a', -- Chocolate Mojito Mocktail
  '6c1ac2b8-f46c-4cc7-9249-758823d837bd', -- Oreo Mojito Mocktail
  'e7c6e201-8e3e-4c62-a897-8f9af877b5fe', -- Lotus Mojito Mocktail
  '8de412a0-c99c-41ab-b09a-843a73db6a56', -- Raspberry Mojito Mocktail
  '8787ffe2-1806-46ed-9251-4b3d79d6f055', -- Espresso Mojito Mocktail
  '074904f6-9eb6-41c1-a1f9-15bde50a748c', -- Mocha Mojito Mocktail
  '162ed431-4ed3-4f8f-8e28-7def4f0031ff', -- Mixed Mojito Mocktail
  '5bc71af5-3e6c-4bac-b85f-097382be9132', -- Passion Mojito Mocktail
  '901f92b2-5356-41f8-ac45-070fc0a3ac55'  -- Mango Mojito Mocktail
);

update products set category = 'Frappuccino' where id in (
  'ef3b4c64-8dad-424c-b981-2e15d5eef583', -- Mocha Frappuccino
  '47d7ce2f-b0e4-4c1e-ab11-d4eb8613e718', -- Caramel Frappuccino
  'fa1524bc-a5c3-4a3d-8329-460a23f3e19e', -- Passion Frappe
  '3cd8a2e9-faa7-48cc-9f0d-9eb52a03b083', -- Mango Frappe
  'de66be3e-9cd0-4095-ae02-99eab8e3b828', -- Pineapple Frappe
  '3a5b283a-910d-4619-abe1-0ef66d94b387'  -- Blueberry Frappe
);

update products set category = 'Brunch & Bites' where id in (
  '75b849f5-5ae4-4148-9850-8026640b6aef', -- Beer/Suqaar
  'f9194a67-b61f-4372-b1f3-f46dde02171e', -- Shakshuuka (Eggs)
  'cef4c8dd-d93f-44b4-b98d-55def0762133', -- Fluffy Laxoox
  '4d752b49-3d40-4673-8e51-324d755f3f4d', -- French Toast
  '3df6c7ab-35c8-43c3-b9c4-13b1d5bace6e', -- Pancakes
  'f199ccd5-ed1a-482a-84f4-407fbd040ed0', -- Cambaabur
  'a284e9b9-e1ea-4890-a649-51c3243029be'  -- Hungry Burger (unverified — see header note)
);

update products set category = 'Wraps' where id in (
  '0a970e22-2767-4ff4-8291-150d63fc1958', -- Beef Wrap
  '5ccfb6be-030e-41f6-b2f9-30d8a9574b7f', -- Chicken Wrap
  '569832c6-6c72-440b-b407-85041bf1b54a'  -- Meat Wrap
);

update products set category = 'Desserts' where id in (
  '9387ebbf-4c40-4ff1-9aa2-c827646bb441', -- Crepe
  '5b82eed1-b853-4446-a8c0-9e3678d0eddb', -- Waffles
  'fb744868-fa37-423e-ba06-185a9a701845'  -- Pudding (Lotus/Oreo/Chocolate/Strawberry)
);

update products set category = 'Cakes (Slices)' where id in (
  'c20bdb71-848c-438b-8c36-fe292b274898', -- Matilda Cake (Chocolate)
  '92868622-af0a-448e-ac49-b71574524c89', -- Fruit Cake / Date Cake
  '38ad4669-eb45-4861-847f-9a3b04dfbbea', -- White Forest Cake (Vanilla)
  'f8641ab6-729a-409e-a623-7dae58196c39', -- Strawberry Cake
  '05a17a3c-8d03-486a-81d7-3596563cd173', -- Pistachio Cake
  'b9058d48-7a3e-4d31-908b-d2e4ea1273ce', -- Caramel Cake
  '549edd98-cf2a-42a9-b057-4fe8ee8a8e9d'  -- Cheese Cake
);

update products set category = 'Full Cakes' where id in (
  '33a52345-aa2e-44c6-97d2-d6902caa017e', -- Matilda Cake (Chocolate) — Full
  'a915834c-f81b-457b-af7c-b572363ae5c3', -- White Forest Cake (Vanilla) — Full
  '1d51e358-635c-4c1f-a83e-d052663cdd26', -- Strawberry Cake — Full
  '46e41a45-8dc4-48eb-8336-d10cc6ddc98e', -- Pistachio Cake — Full
  '9c80daac-4b8c-4eb5-b8ac-f99242cd3bde', -- Caramel Cake — Full
  'b1130143-9dc1-4daa-8db0-b247e0b762b1'  -- Cheese Cake — Full
);

update products set category = 'Wedding Cakes' where id in (
  'c497dae8-0d52-4063-86bf-b9861f017ae6', -- One Tier Cake
  'c16a4c27-19cc-4393-ae74-959ce4ed32c3', -- Two Tier Cake
  'ec2ce7a9-3dee-4f82-8676-214e87962e05', -- Three Tier Cake
  '1d37e308-1b43-41ef-a85c-c77407376b15'  -- Dessert Decoration with Cakes
);

update products set category = 'Mini Cakes' where id in (
  '4f08a3f9-ab95-49b9-9169-3879bcb08fa0', -- Custom Mini Cake
  '88570bea-7ee4-4604-b1aa-2c5799baa562', -- One-Tier Birthday Cake
  '6822a43d-514c-45db-b43d-8d9347c27a5e'  -- Two-Tier Birthday Cake (price intentionally NULL — source gives a range, "Ask about price")
);

-- Defensive self-check: every one of Lavender café's 112 products must now
-- have a non-null category, and the count must still be exactly 112 (no row
-- created, deleted, or re-pointed to a different listing by this migration).
do $$
declare
  total int;
  uncategorized int;
begin
  select count(*), count(*) filter (where category is null)
    into total, uncategorized
    from products
    where listing_type = 'cafe' and listing_id = '0bb4fea0-d93a-48a8-9145-755e91378f5a';

  if total != 112 then
    raise exception 'Expected 112 Lavender café products, found %', total;
  end if;
  if uncategorized != 0 then
    raise exception '% Lavender café products still have no category', uncategorized;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Description fix: "Lavender Cafe offers crunch, drinks, and delicious
-- desserts." ("crunch" is a typo/garbled word, not a real menu item or
-- offering) -> a plain, accurate summary of the actual catalog above. No
-- awards/years/locations invented. description_ar/description_so are already
-- NULL (never set) and stay NULL here — lib/data/cafes.ts already falls back
-- to this English column for both locales when they're null, so this is a
-- straight improvement for AR/SO readers too, not a new gap.
-- ----------------------------------------------------------------------------
update cafes
set description = 'Lavender Café is a coffee shop in Hargeisa serving hot and iced coffee, tea, matcha, smoothies, milkshakes, and mocktails, alongside brunch bites, wraps, waffles, crepes, and a full selection of cakes and desserts.'
where slug = 'lavender';

-- ----------------------------------------------------------------------------
-- Gallery separation: all 8 existing entries in the café's gallery are
-- scans literally titled "Lavender Flowers & Cake menu — page N of 9" — the
-- separate Lavender Flowers & Cakes business's own menu, not café content.
-- Confirmed by cross-checking against city_services (the Flowers & Cakes
-- listing, id b3a8e2f0-6c4d-4a1b-9e5f-7d2c8a9b6e10), whose own `gallery`
-- column is currently empty — exactly where this content belongs. Moved,
-- not deleted: the underlying Storage files are untouched, only which
-- listing's `gallery` jsonb array references them changes.
-- ----------------------------------------------------------------------------
update city_services
set gallery = (select gallery from cafes where slug = 'lavender')
where id = 'b3a8e2f0-6c4d-4a1b-9e5f-7d2c8a9b6e10'
  and gallery = '[]'::jsonb;

update cafes
set gallery = '[]'::jsonb
where slug = 'lavender';
