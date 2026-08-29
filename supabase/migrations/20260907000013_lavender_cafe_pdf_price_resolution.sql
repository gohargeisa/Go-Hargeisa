-- ============================================================================
-- Go Hargeisa — Lavender Café: resolve remaining null prices against the
-- NEW authoritative source ("Lavender Menu last.pdf" — the actual
-- photographed/designed menu, superseding the earlier Excel reconstruction).
--
-- Every value below was read directly off the source's own price badges
-- (visually rendered from the PDF, not OCR/text-extracted — several prices
-- are graphic badges that plain text extraction misses entirely) and cross-
-- referenced against the existing DB row by exact product name match.
--
-- "Two-Tier Birthday Cake" is deliberately NOT resolved here — the source
-- shows a range ("$35-$45, depends on the design"), not a fixed price, and
-- no single value has been chosen without an explicit decision.
--
-- Purely corrective, safe to re-run (idempotent UPDATE by primary key).
-- ============================================================================

update products set price = 2.00 where id in (
  'b8433da6-eee4-4369-aa79-38a6b57f4208', -- Latte Macchiato
  'cdc02524-6600-4d05-8a0c-cb4bd8364038'  -- Caramel Latte
);

update products set price = 3.00 where id in (
  'ef1a2dea-8dce-424b-9349-33100be6e2d1', -- Iced Latte
  '01054a27-3b6b-4f5b-96ec-fc898f641be2', -- Iced Americano
  '51bc6f67-8321-47f7-be3b-8bcec359da33', -- Iced Frappuccino
  '3e3bd70a-7d9a-4be5-8f58-f7b758b3d5d7', -- Iced Coffee
  '1744f630-7a0a-4a9e-993b-f9d971f792fd', -- Iced Mocha
  '7d6bf00e-ab40-4872-89ca-1dd8c030c356', -- Iced Caramel Latte
  '553d4bd6-a18f-4359-8a2f-3e433d7a7374', -- Iced Vanilla Latte
  'c95d9ded-cb98-482a-adec-3d22cb429dc3', -- Banana Smoothie
  '9028dd5b-0466-4fd5-bfcb-907206c37d87'  -- Pineapple/Ananas Smoothie
);
