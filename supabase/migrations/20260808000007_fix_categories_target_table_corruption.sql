-- ============================================================================
-- Go Hargeisa — Fix categories.target_table data corruption
--
-- Found during a live production audit: every `categories` row except
-- hotels/restaurants/cafes currently has target_table = 'city_services',
-- including the Attractions and Events pinned nav rows and every
-- `services`-vertical long-tail category (Real Estate, Flower Shops, Tour
-- Companies, Apartments, Electronics, Transportation, ATMs, Currency
-- Exchange, and the 10 categories already deactivated by
-- 20260807000008/20260808000006). No committed migration set these values —
-- this was written directly against prod by an uncommitted script in an
-- earlier session, bypassing the admin category form (which correctly seeds
-- target_table from the existing row on edit — verified in
-- components/admin/categories-manager.tsx, not the source of this bug).
--
-- Live, user-facing consequences of the corrupted state:
--   - The Attractions nav link (categoryHref switches on targetTable)
--     resolves to /city-services instead of /attractions.
--   - Events and every long-tail services category vanished from
--     nav/homepage (getVisibleCategories excludes non-pinned
--     target_table='city_services' rows — see category_leak_regression_fix).
--   - /services/[slug] pages 404 for all of them (category lookup filters
--     on target_table='services', which currently matches zero rows).
--   - New /join submissions for these categories get miscategorized as
--     City Services.
--
-- This migration restores target_table to what
-- 20260806000001_add_categories_system.sql originally seeded for each slug.
-- Nothing else is touched: is_active/name/sort_order/etc. reflect every
-- legitimate change made since (deactivations, renames) and are left as-is.
-- Idempotent (plain slug-scoped updates, safe to re-run).
--
-- NOT applied to production by this session — written for review; push
-- manually (`supabase db push`) when ready.
-- ============================================================================

update categories
set target_table = 'attractions'
where slug = 'attractions' and target_table = 'city_services';

update categories
set target_table = 'events'
where slug = 'events' and target_table = 'city_services';

update categories
set target_table = 'services'
where target_table = 'city_services'
  and slug in (
    'hospitals', 'pharmacies', 'dental-clinics', 'banks', 'atms', 'currency-exchange',
    'gas-stations', 'car-rentals', 'mosques', 'schools', 'universities', 'gyms',
    'tour-companies', 'apartments', 'supermarkets', 'clinics', 'government-offices',
    'flower-shops', 'real-estate', 'electronics', 'transportation', 'beauty-salons'
  );
