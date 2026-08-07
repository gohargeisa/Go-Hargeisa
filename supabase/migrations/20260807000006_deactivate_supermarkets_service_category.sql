-- ============================================================================
-- Go Hargeisa — Deactivate the generic-services "Supermarkets" category
--
-- Supermarket is now a fully independent module (see
-- docs/supermarket-architecture.md), not a Business Listings category. The
-- categories row seeded in 20260806000001_add_categories_system.sql
-- (slug='supermarkets', target_table='services') let a business owner
-- create a supermarket as a normal `services` row via /join or the admin
-- panel — conflicting with that independence. Deactivating (not deleting)
-- removes it from nav/homepage grid/join-form dropdown/admin category
-- picker (all read live from getCategories()'s is_active filter) while
-- staying reversible and making no schema change. Zero real listings exist
-- under this category today.
--
-- Does NOT touch city_services.category='supermarket' or
-- CityServiceCategory.supermarket (Smart City Map) — both are unrelated,
-- pre-existing directory/map categories, left untouched.
-- ============================================================================

update categories
set is_active = false
where slug = 'supermarkets' and target_table = 'services';
