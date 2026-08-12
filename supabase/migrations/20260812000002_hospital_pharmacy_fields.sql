-- ============================================================================
-- Go Hargeisa — Phase 7b: Hospital / Pharmacy specialized registration
-- fields
--
-- Extends the already-active `hospital` and `pharmacy` city_services
-- categories (target_table='city_services', seeded in
-- 20260806000001_add_categories_system.sql, made the live singular slugs in
-- 20260807000008_city_services_category_migration.sql). Reuses several
-- columns that already exist generically on city_services from earlier
-- phases rather than duplicating them:
--   - `languages` (added 20260811000004)            -> Hospital "Languages Spoken"
--   - `insurance_accepted` (added 20260811000005)    -> Hospital "Insurance Providers" /
--                                                        Pharmacy "Accepted Insurance Providers"
--   - `is_24_hours` (added 20260803000016)           -> Pharmacy "24 Hours"
--   - `service_tags` (added 20260811000001)          -> Pharmacy services list, via a new
--                                                        `pharmacy` vocabulary entry in
--                                                        lib/config/service-tags.ts (no migration needed)
--
-- Purely additive (add column if not exists), safe to re-run.
-- ============================================================================


-- ============================================================================
-- SECTION 1 — CITY_SERVICES
-- ============================================================================

-- ---- Hospital (extends the existing `hospital` category) ----
alter table city_services add column if not exists hospital_type text
  check (hospital_type in (
    'general',
    'private',
    'public',
    'specialist',
    'maternity',
    'childrens',
    'surgical',
    'emergency',
    'medical_center',
    'other'
  ));
alter table city_services add column if not exists beds_count integer;
alter table city_services add column if not exists doctors_count integer;
alter table city_services add column if not exists nurses_count integer;
alter table city_services add column if not exists departments_count integer;
alter table city_services add column if not exists operating_rooms_count integer;
alter table city_services add column if not exists emergency_department boolean;
alter table city_services add column if not exists icu_available boolean;
alter table city_services add column if not exists pharmacy_onsite boolean;
alter table city_services add column if not exists laboratory_onsite boolean;
alter table city_services add column if not exists radiology_onsite boolean;
alter table city_services add column if not exists ambulance_available boolean;
alter table city_services add column if not exists maternity_department boolean;
alter table city_services add column if not exists pediatric_department boolean;
alter table city_services add column if not exists visiting_hours text;

-- ---- Pharmacy (extends the existing `pharmacy` category) ----
alter table city_services add column if not exists pharmacy_type text
  check (pharmacy_type in (
    'community',
    'hospital_pharmacy',
    'twenty_four_hour',
    'online',
    'specialty',
    'other'
  ));
alter table city_services add column if not exists pharmacy_delivery_available boolean;
alter table city_services add column if not exists prescription_required boolean;
alter table city_services add column if not exists home_delivery boolean;
alter table city_services add column if not exists pharmacy_emergency_contact text;


-- ============================================================================
-- SECTION 2 — BUSINESS_JOIN_REQUESTS (intake mirror for every field above)
-- ============================================================================

-- ---- Hospital ----
alter table business_join_requests add column if not exists hospital_type text
  check (hospital_type in (
    'general', 'private', 'public', 'specialist', 'maternity', 'childrens',
    'surgical', 'emergency', 'medical_center', 'other'
  ));
alter table business_join_requests add column if not exists beds_count integer;
alter table business_join_requests add column if not exists doctors_count integer;
alter table business_join_requests add column if not exists nurses_count integer;
alter table business_join_requests add column if not exists departments_count integer;
alter table business_join_requests add column if not exists operating_rooms_count integer;
alter table business_join_requests add column if not exists emergency_department boolean;
alter table business_join_requests add column if not exists icu_available boolean;
alter table business_join_requests add column if not exists pharmacy_onsite boolean;
alter table business_join_requests add column if not exists laboratory_onsite boolean;
alter table business_join_requests add column if not exists radiology_onsite boolean;
alter table business_join_requests add column if not exists ambulance_available boolean;
alter table business_join_requests add column if not exists maternity_department boolean;
alter table business_join_requests add column if not exists pediatric_department boolean;
alter table business_join_requests add column if not exists visiting_hours text;

-- ---- Pharmacy ----
alter table business_join_requests add column if not exists pharmacy_type text
  check (pharmacy_type in (
    'community', 'hospital_pharmacy', 'twenty_four_hour', 'online', 'specialty', 'other'
  ));
alter table business_join_requests add column if not exists pharmacy_delivery_available boolean;
alter table business_join_requests add column if not exists prescription_required boolean;
alter table business_join_requests add column if not exists home_delivery boolean;
alter table business_join_requests add column if not exists pharmacy_emergency_contact text;
