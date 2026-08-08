-- ============================================================================
-- Go Hargeisa — Close another city_service_category enum gap
--
-- Same reasoning as 20260808000002: `city_services.category` is a strict
-- Postgres enum, and createCityService()'s legacyCategoryEnum() helper
-- derives a value for it from the category's slug on every insert. Adding
-- 'clinic'/'beauty_salon'/'men_barbershop' ahead of the categories rows for
-- them (next migration) so no category ever exists without a usable enum
-- counterpart. Kept in its own migration file for the same
-- can't-use-a-new-enum-value-in-the-same-transaction reason as before.
--
-- Safe to re-run (add value if not exists).
-- ============================================================================

alter type city_service_category add value if not exists 'clinic';
alter type city_service_category add value if not exists 'beauty_salon';
alter type city_service_category add value if not exists 'men_barbershop';
