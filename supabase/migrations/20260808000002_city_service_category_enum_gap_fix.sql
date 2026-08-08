-- ============================================================================
-- Go Hargeisa — Close a city_service_category enum gap
--
-- `city_services.category` is a strict Postgres enum (`city_service_category`,
-- see 20260730000003_city_services.sql /
-- 20260803000006_city_services_dynamic_categories.sql), and
-- createCityService()'s legacyCategoryEnum() helper (lib/actions/
-- city-services.ts) derives a value for it from the category's slug
-- (hyphens -> underscores) on every insert, even though category_id is the
-- real source of truth. The 20260808000001 migration added 'dental-clinic'
-- and 'perfume-shop' as `categories` rows without adding matching enum
-- values, so creating a real listing under either would currently fail with
-- "invalid input value for enum city_service_category". 'auto_repair' is
-- added here too, ahead of the category row for it in the next migration,
-- so no category ever exists without a usable enum counterpart.
--
-- Kept in its own migration file (not combined with the categories insert)
-- because a newly added enum value can't safely be relied upon within the
-- same transaction it was added in — same separation already used between
-- 20260803000006 (enum only) and 20260807000008 (categories rows, weeks
-- later).
--
-- Safe to re-run (add value if not exists).
-- ============================================================================

alter type city_service_category add value if not exists 'dental_clinic';
alter type city_service_category add value if not exists 'perfume_shop';
alter type city_service_category add value if not exists 'auto_repair';
