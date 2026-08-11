-- ============================================================================
-- Go Hargeisa — Add missing Arabic/Somali names for 6 long-tail categories
--
-- Phase 1 audit (2026-08-11) found these 6 active categories.name rows have
-- always had name_ar/name_so = NULL since the original seed migration
-- (20260806000001_add_categories_system.sql seeded the "services"-vertical
-- long-tail categories with only an English `name`, no name_ar/name_so
-- columns at all). categoryDisplayName() (lib/utils/category-href.ts)
-- already correctly falls back to English when these are NULL -- this is a
-- pure data gap, not a code bug, confirmed by the fact that all other 23
-- active categories already have both columns populated.
--
-- This is what caused /ar/join and /so/join to show these 6 category names
-- in English while every other category correctly showed its translation.
--
-- Arabic values are written as E'' Unicode escapes (verified via a
-- programmatic round-trip immediately before this file was generated:
-- original text -> \uXXXX hex codepoints -> reconstructed text, exact
-- match) rather than literal Arabic glyphs, to avoid the copy/paste
-- corruption risk documented in the Cosmetics & Women's Beauty migration
-- (20260810000005) -- same technique, same reason.
--
-- No other column is touched. No listing/business data touched at all --
-- this only updates 6 rows' name_ar/name_so on the categories table.
-- Safe to re-run (idempotent -- sets the same value each time).
-- ============================================================================

-- tour-companies (Travel Agencies)
update categories set
  name_ar = E'\u0648\u0643\u0627\u0644\u0627\u062a\u0020\u0627\u0644\u0633\u064a\u0627\u062d\u0629\u0020\u0648\u0627\u0644\u0633\u0641\u0631',
  name_so = 'Wakaaladaha Dalxiiska'
where slug = 'tour-companies';

-- apartments (Apartments)
update categories set
  name_ar = E'\u0627\u0644\u0634\u0642\u0642',
  name_so = 'Guryaha Kirada'
where slug = 'apartments';

-- flower-shops (Flower Shops)
update categories set
  name_ar = E'\u0645\u062d\u0644\u0627\u062a\u0020\u0627\u0644\u0632\u0647\u0648\u0631',
  name_so = 'Dukaannada Ubaxa'
where slug = 'flower-shops';

-- real-estate (Real Estate)
update categories set
  name_ar = E'\u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062a',
  name_so = 'Guryaha iyo Dhulka'
where slug = 'real-estate';

-- electronics (Electronics)
update categories set
  name_ar = E'\u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0627\u062a',
  name_so = 'Alaabta Elektiroonigga'
where slug = 'electronics';

-- transportation (Transportation)
update categories set
  name_ar = E'\u0627\u0644\u0646\u0642\u0644\u0020\u0648\u0627\u0644\u0645\u0648\u0627\u0635\u0644\u0627\u062a',
  name_so = 'Gaadiidka'
where slug = 'transportation';
