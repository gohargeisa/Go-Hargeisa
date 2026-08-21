-- ============================================================================
-- Go Hargeisa — Fold "English Language Institutes" into "Institutes"
--
-- "English Language Institutes" (categories.slug = 'language-institute') is
-- its own separate category row today, architecturally inconsistent with
-- every other "Institutes-shaped" category already in this codebase — Gyms,
-- Beauty Salons, Clinics, Auto Repair, Car Rental, Travel Agencies, Flower
-- Shops, Cosmetics & Beauty, Schools, Universities, Hospitals, Pharmacies —
-- every one of these is ONE category row + a typed sub-field on the listing
-- itself (gym_type, salon_type, clinic_type, garage_type, rental_type,
-- travel_agency_type, flower_shop_type, store_type, school_type,
-- university_type, hospital_type, pharmacy_type), never a separate category
-- per sub-variety. This migration brings Institutes in line with that
-- pattern instead of leaving English Language Institutes as the one
-- exception.
--
-- Verified live before writing this: exactly one real business is filed
-- under 'language-institute' today — "English Excellence Academy"
-- (city_services.slug = 'english-excellence-academy', status='published').
-- It is reassigned to 'institute' with institute_type='language' below, not
-- lost. No other category/business referenced here is touched.
--
-- NOT YET APPLIED. No DDL-execution tool is available in this session (no
-- linked Supabase CLI project, no exec-SQL RPC, no direct Postgres
-- connection) — this file is written for review and must be run manually
-- via the Supabase SQL editor. Safe to re-run: the added column uses
-- `if not exists`, and both UPDATE statements are WHERE-scoped so a second
-- run is a no-op once the first has applied.
--
-- Purely additive + one reassignment + one deactivation. Nothing is
-- deleted: the 'language-institute' category row survives (is_active=false
-- only, same non-destructive convention already used for the earlier
-- flower-shops category collision), and the business itself keeps existing
-- with all its other data untouched, just under a different category_id.
-- ============================================================================

-- institute_type is intentionally free text (no CHECK constraint), matching
-- every other "_type" column in this codebase (gym_type, salon_type, ...) —
-- the admin/join UI is the source of truth for which values are offered,
-- not a rigid enum that needs a migration for every new institute variety.
-- Suggested values: 'language', 'computer_training', 'it_technology',
-- 'vocational_training', 'business_training', 'professional_training',
-- 'skills_development', 'other'.
alter table city_services add column if not exists institute_type text;

update city_services
set category_id = (select id from categories where slug = 'institute'),
    institute_type = 'language'
where category_id = (select id from categories where slug = 'language-institute');

update categories set is_active = false where slug = 'language-institute';
