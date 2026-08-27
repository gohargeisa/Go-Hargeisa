-- ============================================================================
-- Go Hargeisa — Pinnacle Perfumes & Cosmetics: full visual image audit
--
-- Root cause of the reported bug ("VCA Orchidée Vanille" showing a Chanel
-- Coco Mademoiselle photo): confirmed directly (downloaded and viewed the
-- exact live image byte-for-byte) that pinnacleperfumes.com's own Odoo
-- catalog serves the wrong photo for that specific product ID — this is a
-- data error on the source site itself, not a transcription error on this
-- codebase's side (the numeric product ID <-> product name pairing was
-- correctly preserved from the source). The prior migrations' automated
-- check (HTTP status + byte-size match against Odoo's two known "no image"
-- placeholder signatures) could only catch a MISSING photo, not a WRONG
-- REAL photo — a fundamentally different failure mode that requires
-- actually looking at each image.
--
-- Every one of the 198 then-publicly-visible products was downloaded and
-- individually inspected (bottle/box label read and compared against
-- brand + fragrance line + concentration + gender/variant) in this pass.
-- Pack-size-on-label differences alone were NOT treated as a mismatch
-- (same bottle photo legitimately reused across a line's size variants,
-- same precedent as earlier migrations) — only a genuinely wrong brand,
-- wrong fragrance line, wrong gender/variant bottle, or unreadable/broken
-- image counted.
--
-- Result: 190 confirmed correct, 8 hidden here (is_hidden = true, never
-- deleted — full record retained for admin review/correction):
--   - 4 confirmed WRONG product photo:
--     "VCA Orchidée Vanille EDP Natural Spray, 75 ml" -> was showing
--       Chanel Coco Mademoiselle (completely different brand)
--     "Dolce & Gabbana The One Gold for Women Eau de Parfum, 75ml" -> was
--       showing the men's "The One Gold Intense" bottle
--     "Lancome Idôle Eau de Parfum, 50ml" -> was showing "Idôle Le Parfum"
--       (a distinct, more concentrated line variant)
--     "Yves Saint Laurent La Collection M7 Oud Absolu Eau de Toilette,
--       80ml" -> was showing the plain/classic M7, not the Oud Absolu
--       reissue
--   - 3 UNCLEAR (image too low-resolution / wrong angle to confidently
--     confirm the specific fragrance line — per the "never show if
--     uncertain" rule, treated the same as a mismatch):
--     "Jimmy Choo I Want Choo EDP Natural Spray, 100 ml"
--     "Lancome La Nuit Trésor Fleur Nuit Florale Eau de Parfum, 50ML"
--     "Roberto Cavalli EDP, 75ml"
--   - 1 BROKEN (not a placeholder in the previously-known sense — a blank
--     image carrying a third-party retailer's own watermark, not a real
--     product photo at all):
--     "YSL L'Homme EDP Intense, 100ML"
--
-- Process note for future imports from this same source (see also
-- components/pinnacle/pinnacle-storefront.tsx's header comment): an
-- HTTP-200 + non-placeholder-byte-size check is NECESSARY but not
-- SUFFICIENT to prove an image is correct — pinnacleperfumes.com's own
-- catalog can serve a real, normal-sized, but wrong photo. Any future
-- product import from this or a similar third-party source must include
-- an actual visual comparison (download + view + compare label text
-- against brand/name/concentration/size) before publishing, not just a
-- reachability check.
--
-- Purely corrective, safe to re-run (idempotent UPDATE by primary key).
-- ============================================================================

update products set is_hidden = true where id in (
  '85428104-046a-4b18-ac27-f1317bd01c73', -- VCA Orchidée Vanille EDP Natural Spray, 75 ml (was: Chanel Coco Mademoiselle)
  '6eb42087-1ae1-41af-8d7e-ce8716d599db', -- Dolce & Gabbana The One Gold for Women EDP, 75ml (was: men's The One Gold Intense)
  'aaaecb26-0525-468a-891d-9a8abf5ce2c4', -- Lancome Idôle EDP, 50ml (was: Idôle Le Parfum, a different concentration)
  '5855f5ef-137b-4395-8e39-f1b3c5c0ed44', -- YSL La Collection M7 Oud Absolu EDT, 80ml (was: plain/classic M7)
  '1827444e-a676-42d2-8889-1e46e9316706', -- Jimmy Choo I Want Choo EDP Natural Spray, 100 ml (unclear — unreadable low-res image)
  'c36a6d2c-a896-43ff-9dce-069acc5a1915', -- Lancome La Nuit Trésor Fleur Nuit Florale EDP, 50ML (unclear — sub-line not confirmable)
  '3129a47c-d261-48f2-9188-8ecf8baeb2c8', -- Roberto Cavalli EDP, 75ml (unclear — only back-of-box visible)
  'ff5dc9a7-f380-4b75-ae73-798fafdb1242'  -- YSL L'Homme EDP Intense, 100ML (broken — third-party watermark stub, not a real photo)
);
