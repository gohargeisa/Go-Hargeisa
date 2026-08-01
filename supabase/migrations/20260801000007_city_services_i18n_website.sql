-- ============================================================================
-- Go Hargeisa — City Services: multilingual name/description + website
-- The original Phase 2 city_services table (20260730000003) only ever had
-- a single-language `name`/`description`, unlike hotels/restaurants/cafes,
-- which all shipped with _ar/_so columns from day one. Adding them now so
-- entries (e.g. hospitals) can carry real Arabic/Somali content — resolved
-- to the request locale in lib/data/city-services.ts, same pattern already
-- used by getCafes()/getCafeBySlug() for cafes.description_ar/_so.
--
-- `website` was requested but never existed as a column at all (only
-- `maps_url`) — added here too so "leave the website field empty when none
-- exists" is a real, storable state rather than a field that doesn't exist.
--
-- All five columns are nullable — every existing row keeps working exactly
-- as before (falls back to the base `name`/`description`, `website` reads
-- as not set).
-- Safe to re-run.
-- ============================================================================

alter table city_services add column if not exists name_ar text;
alter table city_services add column if not exists name_so text;
alter table city_services add column if not exists description_ar text;
alter table city_services add column if not exists description_so text;
alter table city_services add column if not exists website text;
