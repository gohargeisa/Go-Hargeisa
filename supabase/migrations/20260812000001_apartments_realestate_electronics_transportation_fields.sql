-- ============================================================================
-- Go Hargeisa — Phase 7a: Apartments / Real Estate / Electronics /
-- Transportation specialized registration fields
--
-- Extends 4 already-active `services`-vertical categories (apartments,
-- real-estate, electronics, transportation — all seeded in
-- 20260806000001_add_categories_system.sql, target_table='services') with
-- typed columns, following the exact pattern used for Gym / Travel Agency /
-- Flower Shop in 20260811000006. Purely additive (add column if not exists),
-- safe to re-run.
--
-- Real Estate previously only had a generic custom_fields_schema (property_
-- type/listing_type/bedrooms/bathrooms/size_sqm) from 20260807000002. That
-- schema is retired here in favor of the richer typed-column set below, for
-- consistency with every other category. Zero real real-estate submissions
-- exist today (verified read-only before writing this file), so no data
-- migration from the old jsonb values is needed — the retirement is a clean
-- no-op on live data.
-- ============================================================================


-- ============================================================================
-- SECTION 1 — SERVICES
-- ============================================================================

-- ---- Apartments (extends the existing `apartments` category) ----
alter table services add column if not exists apartment_type text
  check (apartment_type in (
    'furnished',
    'unfurnished',
    'serviced',
    'studio',
    'family',
    'luxury',
    'short_term_rental',
    'long_term_rental',
    'other'
  ));
alter table services add column if not exists bedrooms integer;
alter table services add column if not exists bathrooms integer;
alter table services add column if not exists units_count integer;
alter table services add column if not exists floor_number integer;
alter table services add column if not exists building_floors integer;
alter table services add column if not exists furnished boolean;
alter table services add column if not exists monthly_rent numeric;
alter table services add column if not exists daily_rent numeric;
alter table services add column if not exists security_deposit numeric;
alter table services add column if not exists min_stay_nights integer;
alter table services add column if not exists max_stay_nights integer;
alter table services add column if not exists parking_available boolean;
alter table services add column if not exists wifi_available boolean;
alter table services add column if not exists air_conditioning boolean;
alter table services add column if not exists kitchen_available boolean;
alter table services add column if not exists electricity_included boolean;
alter table services add column if not exists water_included boolean;
alter table services add column if not exists generator_available boolean;
alter table services add column if not exists security_available boolean;
alter table services add column if not exists elevator_available boolean;
alter table services add column if not exists swimming_pool boolean;
alter table services add column if not exists laundry_available boolean;
alter table services add column if not exists family_friendly boolean;
alter table services add column if not exists pet_policy text
  check (pet_policy in ('allowed', 'not_allowed', 'case_by_case', 'other'));

-- ---- Real Estate (extends the existing `real-estate` category). Retires
-- ---- the old custom_fields_schema in favor of typed columns below. ----
update categories set custom_fields_schema = '[]'::jsonb where slug = 'real-estate';

alter table services add column if not exists property_type text
  check (property_type in (
    'residential',
    'commercial',
    'land',
    'villa',
    'house',
    'apartment',
    'office',
    'shop',
    'warehouse',
    'building',
    'agricultural_land',
    'other'
  ));
alter table services add column if not exists listing_purpose text
  check (listing_purpose in ('for_sale', 'for_rent', 'for_lease'));
alter table services add column if not exists price numeric;
alter table services add column if not exists price_currency text
  check (price_currency in ('usd', 'sos', 'other')) default 'usd';
alter table services add column if not exists real_estate_bedrooms integer;
alter table services add column if not exists real_estate_bathrooms integer;
alter table services add column if not exists floors_count integer;
alter table services add column if not exists year_built integer;
alter table services add column if not exists area_sqm numeric;
alter table services add column if not exists land_area_sqm numeric;
alter table services add column if not exists building_area_sqm numeric;
alter table services add column if not exists real_estate_parking_available boolean;
alter table services add column if not exists real_estate_furnished boolean;
alter table services add column if not exists documents_available boolean;
alter table services add column if not exists viewing_available boolean;
alter table services add column if not exists property_condition text
  check (property_condition in ('new', 'excellent', 'good', 'needs_renovation', 'under_construction', 'other'));
alter table services add column if not exists ownership_status text
  check (ownership_status in ('freehold', 'leasehold', 'disputed', 'other'));

-- ---- Electronics (extends the existing `electronics` category) ----
alter table services add column if not exists electronics_business_type text
  check (electronics_business_type in (
    'electronics_store',
    'mobile_phone_store',
    'computer_store',
    'appliance_store',
    'accessories_store',
    'repair_center',
    'camera_store',
    'gaming_store',
    'home_electronics',
    'other'
  ));
alter table services add column if not exists brands_available text[] not null default '{}';
alter table services add column if not exists sells_new boolean;
alter table services add column if not exists sells_used boolean;
alter table services add column if not exists warranty_available boolean;
alter table services add column if not exists electronics_delivery_available boolean;
alter table services add column if not exists electronics_repair_available boolean;
alter table services add column if not exists installation_available boolean;
alter table services add column if not exists payment_options text[] not null default '{}';

-- ---- Transportation (extends the existing `transportation` category) ----
alter table services add column if not exists transportation_type text
  check (transportation_type in (
    'taxi',
    'car_rental',
    'bus_service',
    'minibus',
    'private_driver',
    'airport_transfer',
    'transport_company',
    'truck_cargo',
    'motorcycle_transport',
    'delivery_transport',
    'other'
  ));
alter table services add column if not exists vehicle_count integer;
alter table services add column if not exists passenger_capacity integer;
alter table services add column if not exists driver_available boolean;
alter table services add column if not exists airport_transfer_available boolean;
alter table services add column if not exists city_transfers_available boolean;
alter table services add column if not exists intercity_transport_available boolean;
alter table services add column if not exists rental_available boolean;
alter table services add column if not exists daily_rental_available boolean;
alter table services add column if not exists weekly_rental_available boolean;
alter table services add column if not exists monthly_rental_available boolean;
alter table services add column if not exists delivery_service_available boolean;
alter table services add column if not exists cargo_service_available boolean;


-- ============================================================================
-- SECTION 2 — BUSINESS_JOIN_REQUESTS (intake mirror for every field above)
-- ============================================================================

-- ---- Services-offered chips for Apartments/Real Estate/Electronics/
-- ---- Transportation — carries the owner's picks from the join form's
-- ---- suggestion chips through to `services.services` on conversion
-- ---- (previously that column was only ever set to [categoryName] at
-- ---- conversion time; there was no intake path for it at all). ----
alter table business_join_requests add column if not exists services_offered text[] not null default '{}';

-- ---- Apartments ----
alter table business_join_requests add column if not exists apartment_type text
  check (apartment_type in (
    'furnished', 'unfurnished', 'serviced', 'studio', 'family', 'luxury',
    'short_term_rental', 'long_term_rental', 'other'
  ));
alter table business_join_requests add column if not exists bedrooms integer;
alter table business_join_requests add column if not exists bathrooms integer;
alter table business_join_requests add column if not exists units_count integer;
alter table business_join_requests add column if not exists floor_number integer;
alter table business_join_requests add column if not exists building_floors integer;
alter table business_join_requests add column if not exists furnished boolean;
alter table business_join_requests add column if not exists monthly_rent numeric;
alter table business_join_requests add column if not exists daily_rent numeric;
alter table business_join_requests add column if not exists security_deposit numeric;
alter table business_join_requests add column if not exists min_stay_nights integer;
alter table business_join_requests add column if not exists max_stay_nights integer;
alter table business_join_requests add column if not exists parking_available boolean;
alter table business_join_requests add column if not exists wifi_available boolean;
alter table business_join_requests add column if not exists air_conditioning boolean;
alter table business_join_requests add column if not exists kitchen_available boolean;
alter table business_join_requests add column if not exists electricity_included boolean;
alter table business_join_requests add column if not exists water_included boolean;
alter table business_join_requests add column if not exists generator_available boolean;
alter table business_join_requests add column if not exists security_available boolean;
alter table business_join_requests add column if not exists elevator_available boolean;
alter table business_join_requests add column if not exists swimming_pool boolean;
alter table business_join_requests add column if not exists laundry_available boolean;
alter table business_join_requests add column if not exists family_friendly boolean;
alter table business_join_requests add column if not exists pet_policy text
  check (pet_policy in ('allowed', 'not_allowed', 'case_by_case', 'other'));

-- ---- Real Estate ----
alter table business_join_requests add column if not exists property_type text
  check (property_type in (
    'residential', 'commercial', 'land', 'villa', 'house', 'apartment',
    'office', 'shop', 'warehouse', 'building', 'agricultural_land', 'other'
  ));
alter table business_join_requests add column if not exists listing_purpose text
  check (listing_purpose in ('for_sale', 'for_rent', 'for_lease'));
alter table business_join_requests add column if not exists price numeric;
alter table business_join_requests add column if not exists price_currency text
  check (price_currency in ('usd', 'sos', 'other'));
alter table business_join_requests add column if not exists real_estate_bedrooms integer;
alter table business_join_requests add column if not exists real_estate_bathrooms integer;
alter table business_join_requests add column if not exists floors_count integer;
alter table business_join_requests add column if not exists year_built integer;
alter table business_join_requests add column if not exists area_sqm numeric;
alter table business_join_requests add column if not exists land_area_sqm numeric;
alter table business_join_requests add column if not exists building_area_sqm numeric;
alter table business_join_requests add column if not exists real_estate_parking_available boolean;
alter table business_join_requests add column if not exists real_estate_furnished boolean;
alter table business_join_requests add column if not exists documents_available boolean;
alter table business_join_requests add column if not exists viewing_available boolean;
alter table business_join_requests add column if not exists property_condition text
  check (property_condition in ('new', 'excellent', 'good', 'needs_renovation', 'under_construction', 'other'));
alter table business_join_requests add column if not exists ownership_status text
  check (ownership_status in ('freehold', 'leasehold', 'disputed', 'other'));

-- ---- Electronics ----
alter table business_join_requests add column if not exists electronics_business_type text
  check (electronics_business_type in (
    'electronics_store', 'mobile_phone_store', 'computer_store', 'appliance_store',
    'accessories_store', 'repair_center', 'camera_store', 'gaming_store',
    'home_electronics', 'other'
  ));
alter table business_join_requests add column if not exists brands_available text[] not null default '{}';
alter table business_join_requests add column if not exists sells_new boolean;
alter table business_join_requests add column if not exists sells_used boolean;
alter table business_join_requests add column if not exists warranty_available boolean;
alter table business_join_requests add column if not exists electronics_delivery_available boolean;
alter table business_join_requests add column if not exists electronics_repair_available boolean;
alter table business_join_requests add column if not exists installation_available boolean;
alter table business_join_requests add column if not exists payment_options text[] not null default '{}';

-- ---- Transportation ----
alter table business_join_requests add column if not exists transportation_type text
  check (transportation_type in (
    'taxi', 'car_rental', 'bus_service', 'minibus', 'private_driver',
    'airport_transfer', 'transport_company', 'truck_cargo',
    'motorcycle_transport', 'delivery_transport', 'other'
  ));
alter table business_join_requests add column if not exists vehicle_count integer;
alter table business_join_requests add column if not exists passenger_capacity integer;
alter table business_join_requests add column if not exists driver_available boolean;
alter table business_join_requests add column if not exists airport_transfer_available boolean;
alter table business_join_requests add column if not exists city_transfers_available boolean;
alter table business_join_requests add column if not exists intercity_transport_available boolean;
alter table business_join_requests add column if not exists rental_available boolean;
alter table business_join_requests add column if not exists daily_rental_available boolean;
alter table business_join_requests add column if not exists weekly_rental_available boolean;
alter table business_join_requests add column if not exists monthly_rental_available boolean;
alter table business_join_requests add column if not exists delivery_service_available boolean;
alter table business_join_requests add column if not exists cargo_service_available boolean;
