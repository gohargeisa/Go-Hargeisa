-- ============================================================================
-- Go Hargeisa — Pinnacle Perfumes & Cosmetics: one more placeholder caught
--
-- The previous migration's audit checked for Odoo's 7,322-byte "no image"
-- placeholder specifically; a full re-check of every remaining public
-- product afterward turned up one more product resolving to a *different*,
-- smaller (6,078-byte) Odoo placeholder variant that hadn't been flagged
-- yet: "Michael Kors Sexy Amber EDP Spray, 50ML" (id
-- 9a3cb142-fe49-41f3-988f-85aa68c286db).
--
-- Same fragrance/bottle line as "Michael Kors Sexy Amber EDP, 100ML"
-- (already fixed in the prior migration from caretobeauty.com) — that
-- retailer's own product page uses the identical image for both its 50ml
-- and 100ml size options, so the same verified photo is used here too.
--
-- Purely corrective, safe to re-run (idempotent UPDATE by primary key).
-- ============================================================================

update products set image = 'https://www.caretobeauty.com/cdn-cgi/image/width=1600,height=1600,f=auto/media/catalog/product//m/i/michael-kors-sexy-amber-eau-de-parfum-100ml_1.jpg' where id = '9a3cb142-fe49-41f3-988f-85aa68c286db';
