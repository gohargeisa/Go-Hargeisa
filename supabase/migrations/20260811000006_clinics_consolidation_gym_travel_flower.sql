-- ============================================================================
-- Go Hargeisa — Phase 6: Clinics consolidation + Gym / Travel Agency /
-- Flower Shop specialized registration fields
--
-- Extends 3 already-existing categories (gym, tour-companies, flower-shops)
-- and widens the existing Clinic Type vocabulary so Dental Clinic becomes
-- one clinic type rather than a separate top-level category. No table, row,
-- or column is dropped or deleted anywhere in this file. Zero real rows
-- exist today under dental-clinic, gym, tour-companies, or flower-shops
-- (verified read-only before writing this), so every change below is either
-- purely additive or affects zero live business data.
--
-- Pharmacy (slug 'pharmacy') is not referenced anywhere in this file and is
-- not affected by any statement below.
-- ============================================================================


-- ============================================================================
-- SECTION 1 — CATEGORIES
-- ============================================================================

-- Hides Dental Clinic from new category selection only. Does not delete the
-- category row, does not touch any city_services row, and does not affect
-- the Medical Appointment Engine (departments/doctors/appointments), which
-- is keyed by city_service_id, never by category.
update categories set is_active = false where slug = 'dental-clinic';


-- ============================================================================
-- SECTION 2 — CITY_SERVICES
-- ============================================================================

-- ---- Clinics consolidation: widen clinic_type from the 5 dental-only
-- ---- values to the full requested vocabulary. Not a destructive change —
-- ---- zero existing rows have clinic_type set (0 real Dental Clinic rows
-- ---- exist), so widening this constraint affects no live data.
alter table city_services drop constraint if exists city_services_clinic_type_check;
alter table city_services add constraint city_services_clinic_type_check
  check (clinic_type in (
    'general',
    'dental',
    'hijama',
    'veterinary',
    'eye',
    'dermatology',
    'pediatric',
    'womens_health',
    'mens_health',
    'physiotherapy',
    'ent',
    'laboratory_diagnostic',
    'other'
  ));

-- ---- Gym / Fitness Center (extends the existing `gym` category) ----
alter table city_services add column if not exists gym_type text
  check (gym_type in (
    'mens_gym',
    'womens_gym',
    'mixed_gym',
    'fitness_center',
    'crossfit',
    'personal_training',
    'other'
  ));
alter table city_services add column if not exists classes_offered text[] not null default '{}';
alter table city_services add column if not exists membership_options text[] not null default '{}';
alter table city_services add column if not exists personal_training_available boolean;
alter table city_services add column if not exists group_classes_available boolean;
alter table city_services add column if not exists gym_facilities text[] not null default '{}';
alter table city_services add column if not exists trainers_available boolean;
alter table city_services add column if not exists female_trainers_available boolean;
alter table city_services add column if not exists male_trainers_available boolean;
alter table city_services add column if not exists trial_membership_available boolean;


-- ============================================================================
-- SECTION 3 — SERVICES
-- ============================================================================

-- ---- Travel Agency / Travel Office (extends the existing `tour-companies`
-- ---- category, displayed as "Travel Agencies"). This table is distinct
-- ---- from city_services. Its existing custom_fields_schema
-- ---- (destinations/specialties/license_number) is left untouched and is
-- ---- not removed by this migration. ----
alter table services add column if not exists travel_agency_type text
  check (travel_agency_type in (
    'travel_agency',
    'tour_operator',
    'ticketing_office',
    'visa_services',
    'hajj_umrah_services',
    'local_tours',
    'international_tours',
    'other'
  ));
alter table services add column if not exists flight_ticketing boolean;
alter table services add column if not exists hotel_booking boolean;
alter table services add column if not exists visa_assistance boolean;
alter table services add column if not exists tour_packages boolean;
alter table services add column if not exists airport_transfers boolean;
alter table services add column if not exists car_rental_assistance boolean;
alter table services add column if not exists hajj_umrah_services boolean;
alter table services add column if not exists local_tours boolean;
alter table services add column if not exists international_tours boolean;
alter table services add column if not exists group_tours boolean;
alter table services add column if not exists travel_insurance_assistance boolean;
alter table services add column if not exists languages text[] not null default '{}';

-- ---- Flower Shop (extends the existing `flower-shops` category). Its
-- ---- existing custom_fields_schema (delivery_available/specialties/
-- ---- custom_arrangements) is left untouched and is not removed by this
-- ---- migration. ----
alter table services add column if not exists flower_shop_type text
  check (flower_shop_type in (
    'fresh_flowers',
    'artificial_flowers',
    'wedding_flowers',
    'event_decoration',
    'gift_and_flower_shop',
    'floral_design',
    'other'
  ));
alter table services add column if not exists flower_delivery_available boolean;
alter table services add column if not exists same_day_delivery boolean;
alter table services add column if not exists custom_bouquets boolean;
alter table services add column if not exists wedding_arrangements boolean;
alter table services add column if not exists event_decoration_service boolean;
alter table services add column if not exists gift_wrapping boolean;
alter table services add column if not exists indoor_plants boolean;
alter table services add column if not exists outdoor_plants boolean;
alter table services add column if not exists online_ordering_available boolean;
alter table services add column if not exists delivery_areas text[] not null default '{}';


-- ============================================================================
-- SECTION 4 — BUSINESS_JOIN_REQUESTS
--
-- Intake mirror for every field above. clinic_type / number_of_treatment_
-- rooms / insurance_accepted / languages already exist on this table (added
-- when Dental Clinic first shipped) and are reused as-is under the `clinic`
-- slug going forward — not re-added here. Every other column below is
-- confirmed genuinely new to this table (verified read-only before writing
-- this file).
-- ============================================================================

-- ---- Clinics consolidation: widen this table's clinic_type constraint to
-- ---- match city_services exactly. ----
alter table business_join_requests drop constraint if exists business_join_requests_clinic_type_check;
alter table business_join_requests add constraint business_join_requests_clinic_type_check
  check (clinic_type in (
    'general',
    'dental',
    'hijama',
    'veterinary',
    'eye',
    'dermatology',
    'pediatric',
    'womens_health',
    'mens_health',
    'physiotherapy',
    'ent',
    'laboratory_diagnostic',
    'other'
  ));

-- ---- Gym / Fitness Center ----
alter table business_join_requests add column if not exists gym_type text
  check (gym_type in (
    'mens_gym',
    'womens_gym',
    'mixed_gym',
    'fitness_center',
    'crossfit',
    'personal_training',
    'other'
  ));
alter table business_join_requests add column if not exists classes_offered text[] not null default '{}';
alter table business_join_requests add column if not exists membership_options text[] not null default '{}';
alter table business_join_requests add column if not exists personal_training_available boolean;
alter table business_join_requests add column if not exists group_classes_available boolean;
alter table business_join_requests add column if not exists gym_facilities text[] not null default '{}';
alter table business_join_requests add column if not exists trainers_available boolean;
alter table business_join_requests add column if not exists female_trainers_available boolean;
alter table business_join_requests add column if not exists male_trainers_available boolean;
alter table business_join_requests add column if not exists trial_membership_available boolean;

-- ---- Travel Agency / Travel Office ----
alter table business_join_requests add column if not exists travel_agency_type text
  check (travel_agency_type in (
    'travel_agency',
    'tour_operator',
    'ticketing_office',
    'visa_services',
    'hajj_umrah_services',
    'local_tours',
    'international_tours',
    'other'
  ));
alter table business_join_requests add column if not exists flight_ticketing boolean;
alter table business_join_requests add column if not exists hotel_booking boolean;
alter table business_join_requests add column if not exists visa_assistance boolean;
alter table business_join_requests add column if not exists tour_packages boolean;
alter table business_join_requests add column if not exists airport_transfers boolean;
alter table business_join_requests add column if not exists car_rental_assistance boolean;
alter table business_join_requests add column if not exists hajj_umrah_services boolean;
alter table business_join_requests add column if not exists local_tours boolean;
alter table business_join_requests add column if not exists international_tours boolean;
alter table business_join_requests add column if not exists group_tours boolean;
alter table business_join_requests add column if not exists travel_insurance_assistance boolean;

-- ---- Flower Shop ----
alter table business_join_requests add column if not exists flower_shop_type text
  check (flower_shop_type in (
    'fresh_flowers',
    'artificial_flowers',
    'wedding_flowers',
    'event_decoration',
    'gift_and_flower_shop',
    'floral_design',
    'other'
  ));
alter table business_join_requests add column if not exists flower_delivery_available boolean;
alter table business_join_requests add column if not exists same_day_delivery boolean;
alter table business_join_requests add column if not exists custom_bouquets boolean;
alter table business_join_requests add column if not exists wedding_arrangements boolean;
alter table business_join_requests add column if not exists event_decoration_service boolean;
alter table business_join_requests add column if not exists gift_wrapping boolean;
alter table business_join_requests add column if not exists indoor_plants boolean;
alter table business_join_requests add column if not exists outdoor_plants boolean;
alter table business_join_requests add column if not exists online_ordering_available boolean;
alter table business_join_requests add column if not exists delivery_areas text[] not null default '{}';
