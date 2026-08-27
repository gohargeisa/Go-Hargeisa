-- ============================================================================
-- Go Hargeisa — add 'global_shopping_logistics' to city_service_category
--
-- Same gap-fix pattern as every other new City Services category
-- (20260808000002, 20260808000005, 20260810000004, ...): the legacy
-- `city_services.category` enum still backs owner-dashboard.ts's City
-- Coverage KPI, so every new categories.slug needs a matching enum value
-- (slug with dashes -> underscores). Kept in its own migration/transaction,
-- same as every prior gap-fix, since a newly added enum value can't be used
-- in the same transaction that adds it.
-- Purely additive, safe to re-run.
-- ============================================================================

alter type city_service_category add value if not exists 'global_shopping_logistics';
