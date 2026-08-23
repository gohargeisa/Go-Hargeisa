-- ============================================================================
-- Go Hargeisa — products.category: restore free-text vocabulary
--
-- 20260823000002_universal_cart_orders.sql already dropped this constraint
-- and documented why: category is free text so any vertical (a restaurant's
-- "All Day Breakfast"/"Grills", a café's "hot coffee"/"brunch") can use its
-- own vocabulary without a migration per category. 20260903000003 (kids
-- clothing) re-added a fixed enum covering only the cosmetics/perfume/
-- flowers verticals that existed at the time, silently regressing that —
-- any restaurant/cafe product insert now fails outright since none of their
-- categories are in that list. Dropping it again restores the documented,
-- intended behavior instead of re-enumerating every vertical's vocabulary
-- forever.
-- ============================================================================

alter table products drop constraint if exists products_category_check;
