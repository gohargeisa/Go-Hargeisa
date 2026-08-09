-- ============================================================================
-- Go Hargeisa — Scoped fix: events + currency-exchange categories.target_table
--
-- Live production audit (2026-08-09) confirmed the target_table corruption
-- described in 20260808000007_fix_categories_target_table_corruption.sql is
-- still live and unfixed. That migration was never applied to production
-- (confirmed via `supabase migration list --linked`) and fixes ~22 rows,
-- most of which are out of scope for this change.
--
-- This migration applies ONLY the two rows explicitly in scope:
--   - events: target_table corrupted to 'city_services' -> restored to
--     'events', so the category correctly links to /events instead of
--     /city-services. Also pins it into the top-level nav (is_pinned).
--   - currency-exchange ("Money Exchange"): target_table corrupted to
--     'city_services' -> restored to 'services', its original long-tail
--     vertical. This removes it from the City Services list/page without
--     deleting the category row or creating a new top-level section.
--
-- No other category row is touched. No listing data in events/city_services/
-- services tables is touched — only categories routing metadata. Idempotent
-- (each WHERE clause is scoped to the current corrupted value), safe to
-- re-run.
-- ============================================================================

update categories
set target_table = 'events'
where slug = 'events' and target_table = 'city_services';

update categories
set is_pinned = true
where slug = 'events';

update categories
set target_table = 'services'
where slug = 'currency-exchange' and target_table = 'city_services';
