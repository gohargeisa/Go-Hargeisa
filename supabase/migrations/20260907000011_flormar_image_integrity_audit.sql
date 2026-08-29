-- ============================================================================
-- Go Hargeisa — Flormar Hargeisa: full product/variant image-integrity audit
--
-- Every one of the 225 Flormar products (219 with a parent-level image) and
-- every one of the 743 product_variants rows with an image were individually
-- downloaded and visually inspected (label/packaging/swatch color compared
-- against product name, category, and shade name/code) — the same
-- methodology already applied to Pinnacle Perfumes' catalogue.
--
-- ROOT CAUSE (addresses the "fix the underlying mapping logic" requirement):
-- scripts/import-flormar-catalog.mjs already does the right thing structurally
-- — it matches images to products/variants by exact SKU (Internal Reference),
-- never by array index, scrape order, or approximate name matching. The bugs
-- found here are NOT a mapping-logic defect in that script; they are DATA
-- defects already present in the "existing verified data" it reuses images
-- from (i.e. an earlier import/scrape). The dominant failure mode (~90% of
-- MISMATCH variants found) is: a multi-shade product line where only ONE
-- shade was ever photographed, and every other shade in that line reused
-- that single photo's URL under its own SKU — e.g. the entire 12-shade
-- "Sheer Up" lipstick line and 9-shade "Silk Matte" liquid lipstick line
-- each resolve to one shared photo, as do smaller clusters (CC Cream's 4
-- "Anti-*" variants, "Jelly Look" nail polish's 5 red/brown shades all
-- showing the white "Pure Milk" bottle, etc). A handful of others are a
-- flat color/label contradiction with no duplication involved (e.g. "Navy
-- Blue" nail polish resolving to a bright royal-blue photo, "Red Velvet"
-- lipstick resolving to a pale nude photo).
--
-- PROCESS SAFEGUARD for future imports from this same source: a SKU-exact
-- match against a prior dataset is necessary but not sufficient — the prior
-- dataset itself can contain one photo duplicated across many SKUs. Any
-- future Flormar catalogue refresh should diff each shade's image URL/hash
-- against its siblings within the same product group and flag any group
-- where 2+ differently-named shades resolve to an identical file, rather
-- than trusting "has *an* image" as proof of correctness.
--
-- FIX STRATEGY:
--   - Standalone products (no variants) with a confirmed wrong/unverifiable
--     image, or no image at all: is_hidden = true (never deleted).
--   - A specific product_variant with a confirmed wrong/unverifiable image:
--     is_available = false (removes it from the selectable/orderable shade
--     list — ProductVariantSelector renders it disabled with an
--     out-of-stock overlay) and image = NULL. ProductDetailModal's existing
--     fallback (`activeVariant?.image || product.image`) means a NULLed
--     variant image, if it were ever shown, still falls back to the
--     parent's own (separately verified) photo rather than a placeholder —
--     but is_available = false is the primary fix here since it stops the
--     shade from being selected/ordered at all while its own photo is
--     unverified.
--   - A grouped parent whose own representative card image is a REAL
--     verified photo of one of its real shades, just not the shade its
--     truncated base name happens to read as: fixed directly to the
--     correct, independently-verified image (Big'N Bold Volume Mascara) or
--     left alone with only the bad variant(s) disabled (Precious Curl,
--     Dewy/Hydro/Vitamin Bomb) — never guessed, only ever a swap to an
--     image already confirmed correct for that exact product in this pass.
--   - A category-tag error where the image itself was verified correct
--     (Waterproof Lipliner tagged "eyes" instead of "lips"): corrected in
--     place, no image change.
--
-- Purely corrective, safe to re-run (every statement is an idempotent
-- UPDATE by primary key).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Standalone products with NO image at all (never had one to verify) —
--    hidden per "no image = cannot verify = must hide", DB record intact.
-- ----------------------------------------------------------------------------
update products set is_hidden = true where id in (
  '764c02f1-ea21-431a-aee6-66e60d26a425', -- Color Shadow Stick Ses New
  'fa0b18ac-67e6-4e65-95a3-5d1b2fd506c7', -- Flormar Invisible Loose Powder Bubble Gu
  '0f4e488f-eec3-4300-8a8d-0f367b9dd5e2', -- Metaglam Ne
  '0a299782-2c31-47e5-90c1-458d1d3737d3', -- Hands Up
  '38eb1aae-7a89-4afa-8cbe-19ef7afa1b36', -- Metaglam Cbl
  '7a1b21c4-6d70-43e4-9ac6-a9337d95f235'  -- Smooth Skin Fdt
);

-- ----------------------------------------------------------------------------
-- 2. Standalone product with a confirmed WRONG image (shows an unrelated
--    face/eye makeup brush set, not nail art tools) — hidden.
-- ----------------------------------------------------------------------------
update products set is_hidden = true where id = 'b310e096-c4a2-47b4-8e0c-886c45dfa08b'; -- Nail Art Brush Set Brs

-- ----------------------------------------------------------------------------
-- 3. "Big'N Bold Volume Mascara" parent card was showing the group's
--    "Lengthening" shade photo (import script's generic "first variant with
--    an image" fallback) despite the parent's own name specifically reading
--    "Volume" — replaced with the independently visually-verified photo of
--    the group's actual "Volume" shade (variant id 5d1a188c, confirmed
--    MATCH: tube explicitly labeled "volume mascara").
-- ----------------------------------------------------------------------------
update products set image = 'https://d1ak51zwgmtslz.cloudfront.net/PRODUCTS_EN/8682536040402_1.jpg'
  where id = 'a202eb15-20bb-4fc7-a6be-9b67375d957a'; -- Big N Bold Volume Mas

-- ----------------------------------------------------------------------------
-- 4. "Flormar Juicy Lip Gloss Apple" — base name embeds a flavor ("Apple")
--    that does not exist as any of this group's 4 real, verified shades
--    (Blueberry/Orange/Raspberry/Watermelon, all individually confirmed
--    correct). "Apple" was a naming-parser artifact, not a real SKU.
--    Renamed to the flavor-neutral base name every other multi-shade
--    Flormar product already uses.
-- ----------------------------------------------------------------------------
update products set name = 'Flormar Juicy Lip Gloss'
  where id = '808d2303-1ccf-4b9b-80ab-7380215ed880';

-- ----------------------------------------------------------------------------
-- 5. Category-tag correction: "Waterproof Lipliner" was tagged "eyes" —
--    its image is verified correct (a lip liner pencil), only the category
--    field was wrong, causing it to wrongly surface under the Eyes filter.
-- ----------------------------------------------------------------------------
update products set category = 'lips'
  where id = '530da217-4f52-4724-8ae9-7ecec6077d99'; -- Waterproof Lipliner Pcl

-- ----------------------------------------------------------------------------
-- 6. Variant-level fixes: every product_variants row individually confirmed
--    MISMATCH (clearly wrong product/color/label) or UNCLEAR (could not be
--    confidently verified — treated the same as a failure per "never guess,
--    hide if uncertain") is disabled from selection/ordering and its
--    unverified image cleared. Grouped by parent product for readability;
--    every UPDATE targets exact primary keys, safe to re-run.
-- ----------------------------------------------------------------------------

-- Wet Wipes (both shown images are actually a 4-pan eyeshadow palette)
-- Metaglam Glitter Face&Body (all 3 shown images are eyeshadow/eye-pencil products)
-- Angled Brow Pencil "Beige" (shows a Color Treasure mascara tube)
-- Baked Eyeshadow "Pink Diamond" (shows an Extreme Tattoo eye stick)
-- Brow Pomade (all 4 shades share one indistinguishable photo)
update product_variants set is_available = false, image = null where id in (
  'cea4cf58-9186-4838-bfbd-bdfc05a309c3',
  '1453cc30-1070-40a9-9585-c8040240e815',
  'caeb6b26-bbe3-483c-a7ad-fde5db426529',
  '253646f9-f451-453a-add6-f686fbcb7485',
  '12cb1295-1c52-4dd6-a303-597a6be61c2d',
  'fb104404-30b6-48bf-8fb9-2f62b4c68087',
  'c0373425-f04f-464e-a310-ee43d9e14ccf',
  'de934c5a-ef33-4554-aa5a-3747ff4dd22a',
  'bbbf1b4f-2615-4ea7-b462-39b98d680b42',
  'a2ed6172-6aca-4fca-a228-1c41d9703e8e',
  '043fa608-a8a4-4b51-9629-e9f89d4177ed'
);

-- Ext. Tattoo Eye Stick "Navy"/"Onyx" (both share the "Cocoa" shade's photo)
-- Color Your Life Mas "Brown" / Eye Puff "Ivory" (unclear/generic photos)
update product_variants set is_available = false, image = null where id in (
  'c67bf67e-182d-4b2e-af85-725087b5fa1b',
  'b7e742b7-63a0-41b6-89f4-56ade2084ed7',
  '951330b0-883f-4418-899c-22e29ce9e7fa',
  'df5ca5fa-11ff-417d-9bc1-7141868437b9'
);

-- Spider Lash "3in1" (dup of "Deep Black"); Waterproof Eyeliner "Pure White"
-- (dup of "Warm Brown" 105); Waterproof Lipliner "Deep Bordx"/"Chclt Fondue"
-- (both dup of "Elgnt Bordx" 205); Baked Blush "Dried Rose" (color mismatch)
update product_variants set is_available = false, image = null where id in (
  '5f063a9f-554b-46f9-9c92-a5c540258c10',
  'b5e2c45c-289f-4d41-a406-1ea4de757ea9',
  '478316b1-39cd-499a-bcaa-fae5fad09376',
  '0837dd03-95b1-4cf1-8d0b-c7e1bf27f5a2',
  'e9d4f513-f9a7-4dfb-b7a7-17b281f4a269'
);

-- Dewy Lip Booster "Match"/"Castle"/"Party"/"Vintage" (all 4 share one photo)
-- Dewy Lip Glaze "Bronze Statue"/"Cherry Blossom" (color mismatch)
-- Glow Lip Oil "Cocoa Kiss" (color mismatch); Dewy Lip Glaze "Light Beige" (unclear)
update product_variants set is_available = false, image = null where id in (
  'bd19d688-8de9-4edd-8727-0969a9106b1b',
  'd5c7bfea-5e0d-410e-9037-43f07e131bbd',
  '479a970e-fd3c-4d01-8c02-5f5b4d77e022',
  '7e09d038-2fd4-475c-901c-10d9b46ae182',
  'd80ce90f-39a1-4e43-b8d8-9eb25726b685',
  '0a9b08c2-7098-4ebe-bad3-cd4b977e8799',
  'c9fb7b55-1e19-486f-a2d4-4b24d2836a21',
  '7c56375b-88c3-4580-b340-30c089645aee'
);

-- K-spirit Blur Lip Tint "Rose Latte" (color mismatch) + several generic-
-- named unclear shades across K-spirit lip/cheek lines
update product_variants set is_available = false, image = null where id in (
  '6f07751f-7f47-4381-aa94-bd71d7704e5c',
  'fe9d20cd-4a04-4e63-aa93-fe276afe7742',
  '0d95adc2-71c1-496b-9e8d-f4fc44c4f7d4',
  'fc6dc7f0-5322-4ceb-87c4-53b88c5f12e4',
  'b348a548-f5c0-4f85-832d-ac0d212eca57',
  '739d7e39-6064-4934-9762-d69ed49bf667'
);

-- Lightweight Lip Powder "Legendary Red"/"Deep Bordeux" (nude photo, no red);
-- Water Lip Stain "Infinite Pink" (bright red, not pink); Breathing Color
-- nail polish "Icy Pink" (beige, no pink); "Fall Rose"/"This Night" (unclear)
update product_variants set is_available = false, image = null where id in (
  '6497c9bd-457e-4ba7-9908-bdc226942036',
  '1188605d-0ee2-4827-9ecd-12ce39c4fb81',
  'a4203deb-546b-4e9f-b189-16a0099c8713',
  '380f5bd0-61f8-4ffc-bbe1-129b3548c3aa',
  'd4c6bac4-9878-46fe-bd20-c9150e927818',
  'a4567d73-7e1b-4952-bf6b-e156a544c0b6'
);

-- Flormar Fne nail polish "Red Velvet"/"Rose Coral" (color mismatch);
-- "Peach N Crem" (unclear)
update product_variants set is_available = false, image = null where id in (
  '55eab177-b00e-4892-8f94-dffe13971bc5',
  '61c9b1bc-17a5-4f11-85ce-28de6ead83b4',
  '41d9b544-7d8b-41fe-ae80-0646a3792ab5'
);

-- Flormar Fne nail polish: "Sea Foam"/"White Dream"/"Navy Blue"/"Ash Blue"/
-- "Peach N Cream" (each a clear color-name contradiction); "Blue Industry"/
-- "Exprsve Blckbrry" (unclear)
update product_variants set is_available = false, image = null where id in (
  '1e1bfdea-2de5-4f02-9607-6fd0e63ab382',
  '1017a804-1753-4b70-8625-7c26f69697b3',
  'cfc23028-5521-4368-80db-2385aa9ad5ce',
  '8d2e5f20-b5ee-4005-9b18-4f58d403aca1',
  '43ad96ed-0ee8-4ddd-8c63-5a6052a13442',
  'c939dbdf-cd8c-4334-b379-6e3b23249871',
  '753a1fa6-5de3-479e-b983-87e812fa9435'
);

-- Full Color nail polish "Playful Pink" (shows purple, not pink);
-- "Oasis"/"Blush Dusk" (unclear)
update product_variants set is_available = false, image = null where id in (
  '575fd636-8773-4b45-b4b1-a6f91c5c26e7',
  '67111197-63d7-4d38-b6b6-ec286acf1a8e',
  'b193b6ce-0452-4799-b07f-50e7cff51569'
);

-- Glam Kiss liquid lipstick "Berry Crush"/"Crimson Kiss"/"Scarlet Heat" (all
-- 3 share one bronze/copper photo); Glitter nail polish "Blackstar"/"Red In
-- Silver" (both show copper/rose-gold); "Hd Weig. Matte" lipstick "Ruby
-- Brown"/"Mocha" (both show mauve-pink); Jelly Look nail polish "Fire Red"/
-- "Stunning Red"/"Coffee With Milk"/"Sangria" (all 4 share the white "Pure
-- Milk" photo); "Ruby"/"Country" (unclear)
update product_variants set is_available = false, image = null where id in (
  '8a8e637a-fe8d-440e-86e4-f263dc7e2a6f',
  '24ad4a37-e693-4f79-9cbb-949b843dfb7c',
  '298d9417-80f3-47f1-8aac-a4e01afc60f8',
  '405cd597-3096-4e9f-87b0-da23ac943cec',
  '5a21fdba-45be-44f7-90d1-e6c14294bcec',
  '3655bdc0-804d-4eb8-894c-8b228856b1b8',
  '8a87baa7-4631-4258-98a1-2973c5c34efd',
  'dc37bc31-c8e6-4b0f-8573-0f0655ea98d7',
  '71e55790-67d9-4386-a679-8d6cb4c6684e',
  '94e1a317-5507-4f46-a5e8-b5ad62ac5054',
  '4dcb7454-259c-4257-9480-86dec0f85765',
  '8d126d7d-554d-490b-80f9-953bf884b77f',
  '2816b7d7-6598-4900-b8c9-91540011d993'
);

-- Latte Addiction Bronzing Drops "Blnde Espresso"/"Honey Frappe" (verified
-- byte-for-byte identical images shared between 2 different shades);
-- Kiss Me More Lip Tattoo "Peach"/"Skin" (unclear)
update product_variants set is_available = false, image = null where id in (
  '82bfaa35-0f96-4df5-87d2-ade0476afabc',
  '3c3206c2-f342-4639-83f9-e00f4a061a6c',
  '60ba2b2b-b9dd-4492-b87b-b39f6b7a7507',
  'be7b1452-ad01-44c3-b9f6-14708f48316b'
);

-- Mono Ces eyeshadow "Soft Brown"/"Grapefruit Pink" (unclear color match)
update product_variants set is_available = false, image = null where id in (
  'ea9e7677-daae-4f6a-95a8-2259a14fee8a',
  '5fc0dae4-85e2-4c2c-a8df-f570122a1a28'
);

-- Mono Ces "Earth" (shows blue, not earth-tone); Mood Booster Liquid Blush
-- "Feel The Red" (dup of "Thats Rosewood"); Perfect Coverage Concealer
-- "Lght/medium" (dup of "Light"); Perfect Coverage Foundation "Hney Np"/
-- "Hazel Np" (both dup of "Light Ivory Np"); Quick Dry nail polish "Red
-- Velvet New" (pale pink, not red); "Ivory Glow"/"Tender Salmon" (unclear/
-- corrupted crop)
update product_variants set is_available = false, image = null where id in (
  'bafaef5d-41d0-48af-ba3b-4a9467b6dfc7',
  '4cd1eb2c-1c35-4366-acd8-559a98d81375',
  'c421f0d5-988f-4a1e-8bda-25b755efcb99',
  'c3aced98-2b39-4e45-94bd-bb45cd051bb9',
  'e8066687-0e5e-4376-a7fc-dc611511af3c',
  '1e6d67e0-5c78-496f-8437-87719c09e67d',
  'f8f09d5d-d1cc-4b72-967a-aa812519ff2f',
  'de162866-ff58-41ee-a384-e8a5f31702bd'
);

-- Quick Dry nail polish "Salt Water Love" (shows an unrelated lifestyle
-- photo of red/burgundy-polished hands, not a bottle shot); Sheer Up
-- lipstick — 11 of its 12 shades ("So You" through "Candy Crush") all share
-- one duplicated photo, only nominally the "Harmony" base shade; Shimmer &
-- Shine "Soft Lilac" (shows bronze, not lilac)
update product_variants set is_available = false, image = null where id in (
  'ed234197-390c-48f6-8154-293efb709fd9',
  '76e2438b-0544-4118-be2f-87b587a9a767',
  'a1592af0-e286-473e-83ee-fc6b892725e4',
  'd7475afa-16c9-4e3f-af32-526578c09cc3',
  'f88be090-1798-458d-965f-d94b42af45b3',
  '548b6a0b-5886-425f-bd13-16353e9787f5',
  'd439ae57-ebb4-4b40-b0dd-46df0a26e597',
  '31efa3f5-519b-4889-80f3-a9a7e0cc7855',
  '3657ba47-d6da-4775-8a49-7e7d3a2a1b7a',
  'adff3d05-8960-4025-8122-5560c5a39afc',
  '20a4a28a-617a-4a0a-a57b-1c8eca10ac01',
  '0d725d37-bcc2-446e-b0f6-2289caa6c4e1',
  'b2059e1f-e88d-42fa-a181-c5b462503033',
  '9b685e1b-5389-446f-beb7-ccc9c444dfa5',
  '463a6737-cf30-498c-996e-496d1d07282c'
);

-- Silk Matte liquid lipstick — 7 of 9 shades in this batch share one
-- duplicated red photo, confirmed wrong for "Fall Rose"/"Cherry Blossom"
-- and unverifiable for 5 more generically-named shades
update product_variants set is_available = false, image = null where id in (
  '576eaa5c-79d5-42c8-a012-08080e6fc590',
  '76b59807-c224-43fc-aab4-3183c0d94770',
  '6b047641-89c6-4ab7-9b17-48a29fd39637',
  '4bdf6916-5bcc-4075-9226-91d3fc10fef7',
  '271c8117-156d-4e6b-9ac3-9f5994b23440',
  '444afc87-0b01-4b98-83b8-241346e00b0b',
  'bba0adc6-c329-41b9-b028-394b6beb4a68'
);

-- Wet&Dry compact powder "Amber" (dup of "Honey"); CC Cream "Anti-redness"/
-- "Anti-dark Circles"/"Anti-fatigue" (all 3 dup of "Anti-dullness"); Bomb
-- Serum&Primer "Dewy Bomb"/"Vitamin Bomb" variants (both actually show the
-- "Hydro Bomb" label — the real, correctly-verified "Hydro Bomb" variant is
-- left untouched); "Medium Caramel"/"Banana Bliss" (unclear)
update product_variants set is_available = false, image = null where id in (
  '38bcf727-3a60-4345-892e-a52ada94213b',
  '7a77bb23-133a-46d1-8486-ee09fc508dbe',
  'a8d1ca8f-7d7e-4266-978b-22844f2f5807',
  'e203148a-9ae5-4042-990c-2328ae3e8c1a',
  '2779b4bc-0790-4438-9137-54d3095b4e1d',
  'c9599d52-316a-4b2f-bcc9-8b4b23ebbc1d',
  'ef842a6b-a8dc-4cc9-b3e9-68731975bcbb',
  'fa196978-7100-44d1-b695-7c10742ed28e'
);

-- Precious Curl Mascara "002 Waterproof" — this shade has NO photo of its
-- own at all (the group's only real photo belongs to "001 Carbon Black",
-- already correct and untouched); disabled until a real Waterproof photo
-- is sourced rather than left selectable under the Carbon Black fallback.
update product_variants set is_available = false, image = null where id = '90be3bdc-8b80-449d-b0af-5d4fa8ca6110';
