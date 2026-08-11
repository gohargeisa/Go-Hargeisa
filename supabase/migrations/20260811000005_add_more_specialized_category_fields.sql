-- ============================================================================
-- Go Hargeisa — Phase 5: Cosmetics / Perfumes / Car Rental / Dental Clinics /
-- Auto Repair specialized registration fields
--
-- Extends the same category-specific-fields pattern already shipped for
-- Hotels/Restaurants/Cafes/Schools/Universities/Salons/Barbershops to five
-- more categories. Every column is nullable or default-safe, purely
-- additive, and safe to re-run. No existing row in any table is read,
-- updated, or deleted here. None of the 7 already-shipped categories are
-- touched by this file.
--
-- Dental Clinics already has a live Medical Appointment Engine (doctors,
-- departments, bookable appointments) -- nothing here touches that; these
-- columns are clinic-level registration info only.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CITY_SERVICES -- Cosmetics & Women's Beauty + Perfumes (shared retail fields)
-- ----------------------------------------------------------------------------
alter table city_services add column if not exists store_type text
  check (store_type in ('boutique', 'multi_brand', 'kiosk', 'online_and_physical', 'other'));
alter table city_services add column if not exists brands text[] not null default '{}';

-- ----------------------------------------------------------------------------
-- CITY_SERVICES -- Car Rental
-- ----------------------------------------------------------------------------
alter table city_services add column if not exists rental_type text
  check (rental_type in ('self_drive', 'with_driver', 'both', 'other'));
alter table city_services add column if not exists vehicle_types text[] not null default '{}';
alter table city_services add column if not exists minimum_rental_period text;
alter table city_services add column if not exists drivers_license_required boolean;
alter table city_services add column if not exists deposit_required boolean;
alter table city_services add column if not exists fleet_size integer;

-- ----------------------------------------------------------------------------
-- CITY_SERVICES -- Dental Clinics (clinic-level fields only; the existing
-- doctors/departments/appointments tables are untouched)
-- ----------------------------------------------------------------------------
alter table city_services add column if not exists clinic_type text
  check (clinic_type in ('general_dentistry', 'orthodontics', 'pediatric_dentistry', 'multi_specialty', 'other'));
alter table city_services add column if not exists number_of_treatment_rooms integer;
alter table city_services add column if not exists insurance_accepted text[] not null default '{}';

-- ----------------------------------------------------------------------------
-- CITY_SERVICES -- Auto Repair & Car Services
-- ----------------------------------------------------------------------------
alter table city_services add column if not exists garage_type text
  check (garage_type in ('general_repair', 'specialized', 'dealership_affiliated', 'mobile_repair', 'other'));

-- ----------------------------------------------------------------------------
-- BUSINESS_JOIN_REQUESTS -- intake mirror
--
-- staff_count / walk_ins_accepted / home_service_available / languages
-- already exist on this table (added for Salons/Barbershops/Schools/
-- Universities) -- deliberately NOT re-added here; only their read/write
-- gate in application code widens to also cover Auto Repair (staff_count,
-- walk_ins_accepted, home_service_available) and Dental Clinics (languages).
-- Every column below is genuinely new to this table.
-- ----------------------------------------------------------------------------
alter table business_join_requests add column if not exists store_type text
  check (store_type in ('boutique', 'multi_brand', 'kiosk', 'online_and_physical', 'other'));
alter table business_join_requests add column if not exists brands text[] not null default '{}';

alter table business_join_requests add column if not exists rental_type text
  check (rental_type in ('self_drive', 'with_driver', 'both', 'other'));
alter table business_join_requests add column if not exists vehicle_types text[] not null default '{}';
alter table business_join_requests add column if not exists minimum_rental_period text;
alter table business_join_requests add column if not exists drivers_license_required boolean;
alter table business_join_requests add column if not exists deposit_required boolean;
alter table business_join_requests add column if not exists fleet_size integer;

alter table business_join_requests add column if not exists clinic_type text
  check (clinic_type in ('general_dentistry', 'orthodontics', 'pediatric_dentistry', 'multi_specialty', 'other'));
alter table business_join_requests add column if not exists number_of_treatment_rooms integer;
alter table business_join_requests add column if not exists insurance_accepted text[] not null default '{}';

alter table business_join_requests add column if not exists garage_type text
  check (garage_type in ('general_repair', 'specialized', 'dealership_affiliated', 'mobile_repair', 'other'));
