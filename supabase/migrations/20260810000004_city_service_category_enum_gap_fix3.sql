-- ============================================================================
-- Go Hargeisa — Close another city_service_category enum gap
--
-- Same reasoning as 20260808000002/20260808000005: `city_services.category`
-- is a strict Postgres enum, and createCityService()'s legacyCategoryEnum()
-- helper derives a value for it from the category's slug on every insert.
-- Adding 'cosmetics_beauty' ahead of the categories row for it (next
-- migration) for the new "Cosmetics & Women's Beauty" category, so no
-- category ever exists without a usable enum counterpart.
--
-- Kept in its own migration file for the same
-- can't-use-a-new-enum-value-in-the-same-transaction reason as before.
--
-- Safe to re-run (add value if not exists).
-- ============================================================================

alter type city_service_category add value if not exists 'cosmetics_beauty';
