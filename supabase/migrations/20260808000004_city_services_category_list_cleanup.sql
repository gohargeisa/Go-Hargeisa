-- ============================================================================
-- Go Hargeisa — City Services category list cleanup
--
-- Deactivates 12 low-priority City Services categories per explicit
-- request, narrowing the public-facing list down to: Mosques, Hospitals,
-- Pharmacies, Dental Clinics, Schools, Universities, Perfumes, and Auto
-- Repair & Car Services. Deactivation (not deletion) — same reversible
-- pattern used throughout this project (see 20260807000006/20260808000001)
-- — keeps every row, its translations, and (if any existed) its listings
-- intact; only `getCategories()`'s is_active filter, which the City
-- Services page/filters/admin picker/nav all already read live, stops
-- surfacing them. Verified via read-only query before writing this
-- migration: all 12 have zero real listings, so nothing becomes hidden
-- content — only the empty category slot itself disappears.
--
-- Deliberately NOT touched: park-playground, kids-family, taxi-service,
-- gym, car-rental, car-wash (not mentioned in the request either way),
-- supermarket (already inactive), and the 8 categories on the explicit
-- keep list.
--
-- Safe to re-run (simple flag flips).
-- ============================================================================

update categories
set is_active = false
where target_table = 'city_services'
  and slug in (
    'internet-telecom', 'visa-immigration', 'government-office', 'ev-charging',
    'sports-club', 'post-office', 'water-service', 'electricity-service',
    'fire-station', 'police-station', 'bank', 'gas-station'
  );
