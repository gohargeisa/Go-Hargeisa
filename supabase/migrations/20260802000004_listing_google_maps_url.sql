-- ============================================================================
-- Go Hargeisa — saved Google Maps URL per listing (hotels/restaurants/
-- cafes/attractions/services). city_services already has its own maps_url
-- column (20260730000003_city_services.sql) and is untouched here.
--
-- Backward compatible: this is purely additive. Every "Open in Google
-- Maps" / "Directions" link already falls back to a coordinate-built URL
-- via lib/utils/google-maps.ts's resolveMapsUrl(coords, savedUrl) — a
-- listing with no saved URL keeps working exactly as it does today, this
-- column just lets an admin override it with a curated link (a specific
-- Google Maps Place, not just a bare lat/lng search).
-- Safe to re-run.
-- ============================================================================

alter table hotels add column if not exists google_maps_url text;
alter table restaurants add column if not exists google_maps_url text;
alter table cafes add column if not exists google_maps_url text;
alter table attractions add column if not exists google_maps_url text;
alter table services add column if not exists google_maps_url text;
