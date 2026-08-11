-- ============================================================================
-- Go Hargeisa — Remove ATMs and Currency Exchange categories
--
-- Per explicit request: these two categories must no longer appear anywhere
-- (nav, homepage, City Services, /join business registration dropdown,
-- category filters, search). Both are `services`-vertical rows (seeded in
-- 20260806000001_add_categories_system.sql) — is_active=false is the
-- established, reversible removal pattern already used for 10+ other
-- retired categories in this codebase (banks, mosques, gyms, ...), so this
-- one migration removes them from every public surface at once: every
-- public read (getCategories/getServiceCategories/getCityServiceCategories/
-- getVisibleCategories/matchCategoryFromQuery) filters on is_active=true —
-- see lib/data/categories.ts. Rows are kept (not deleted) so any existing
-- services.category_id reference doesn't break and admin history/audit
-- stays intact — same as every prior deactivation.
--
-- Also defensively re-normalizes target_table to 'services' in case
-- production still has the target_table corruption documented in
-- 20260808000007_fix_categories_target_table_corruption.sql (that migration
-- fixed currency-exchange via 20260809000003 but explicitly left atms
-- out of scope) — belt-and-suspenders so these two are excluded from
-- city_services grouping too, regardless of current live drift state.
--
-- Safe to re-run (idempotent updates, scoped by slug).
-- ============================================================================

update categories
set is_active = false, target_table = 'services'
where slug in ('atms', 'currency-exchange');
