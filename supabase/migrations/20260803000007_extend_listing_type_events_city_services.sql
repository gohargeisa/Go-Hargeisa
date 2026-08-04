-- ============================================================================
-- Go Hargeisa — Listings Upgrade Phase 0a: unlock polymorphic types for
-- Events and City Services
--
-- The `listing_type` enum (reviews / favorites / saved_trip_items) currently
-- only covers hotel/restaurant/cafe/attraction/service. This adds 'event'
-- and 'city_service' so those two categories can eventually get reviews,
-- favorites, and "Add to Trip" support like every other listing type.
--
-- Deliberately split into its own migration, separate from the function/
-- column changes that will reference these new values (see
-- 20260803000008_events_city_services_rating_columns.sql) — Postgres
-- disallows using a newly added enum value within the same transaction that
-- added it. This mirrors 20260729000002_extend_listing_type_for_services.sql,
-- which added 'service' on its own and let 20260802000001 wire it into
-- refresh_listing_rating() in a later migration.
-- ============================================================================

alter type listing_type add value if not exists 'event';
alter type listing_type add value if not exists 'city_service';
