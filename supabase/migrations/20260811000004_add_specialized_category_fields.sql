-- ============================================================================
-- Go Hargeisa — Phase 4: Restaurant / Cafe / School / University / Salon /
-- Barbershop / Cosmetics specialized registration fields
--
-- Extends the category-specific-fields pattern already shipped for Hotels
-- (20260811000003_add_hotel_registration_fields.sql) to six more categories.
-- Every column is nullable or default-safe, purely additive, and safe to
-- re-run (all statements use IF NOT EXISTS). No existing row in any table
-- is read, updated, or deleted here. Hotels' own columns/constraints are
-- NOT touched by this file — verified against the live schema before
-- writing this (hotel_type/star_rating CHECK constraints confirmed
-- unchanged on both hotels and business_join_requests).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RESTAURANTS (core table)
-- ----------------------------------------------------------------------------
alter table restaurants add column if not exists restaurant_type text
  check (restaurant_type in ('somali', 'international', 'fast_food', 'cafe_restaurant', 'family', 'fine_dining', 'buffet', 'bakery_restaurant', 'other'));
alter table restaurants add column if not exists seating_capacity integer;
alter table restaurants add column if not exists number_of_tables integer;
alter table restaurants add column if not exists online_order_url text;
alter table restaurants add column if not exists languages text[] not null default '{}';

-- ----------------------------------------------------------------------------
-- CAFES (core table)
-- ----------------------------------------------------------------------------
alter table cafes add column if not exists cafe_type text
  check (cafe_type in ('coffee_shop', 'dessert_cafe', 'study_cafe', 'rooftop_cafe', 'tea_house', 'other'));
alter table cafes add column if not exists seating_capacity integer;

-- ----------------------------------------------------------------------------
-- CITY_SERVICES -- Schools + Universities (shared "education institution" fields)
-- ----------------------------------------------------------------------------
alter table city_services add column if not exists school_type text
  check (school_type in ('primary', 'secondary', 'primary_secondary', 'international', 'private', 'public', 'vocational', 'other'));
alter table city_services add column if not exists curriculum text
  check (curriculum in ('somaliland', 'cambridge', 'international', 'arabic', 'islamic', 'other'));
alter table city_services add column if not exists education_levels text[] not null default '{}';
alter table city_services add column if not exists age_range_grades text;
alter table city_services add column if not exists number_of_classrooms integer;

alter table city_services add column if not exists university_type text
  check (university_type in ('public', 'private', 'community_college', 'vocational_institute', 'other'));
alter table city_services add column if not exists degree_levels text[] not null default '{}';
alter table city_services add column if not exists faculties_offered text[] not null default '{}';
alter table city_services add column if not exists number_of_buildings integer;

-- Shared by Schools + Universities -- every one of these is optional and
-- off by default; no gender-split statistic exists or is added.
alter table city_services add column if not exists education_facilities text[] not null default '{}';
alter table city_services add column if not exists number_of_students integer;
alter table city_services add column if not exists number_of_teachers integer;
alter table city_services add column if not exists admissions_open boolean not null default true;
alter table city_services add column if not exists admission_phone text;
alter table city_services add column if not exists admission_whatsapp text;
alter table city_services add column if not exists admission_url text;
alter table city_services add column if not exists application_url text;

-- Same concept/shape as hotels.number_of_floors / year_established / languages
-- -- new to THIS table, reused pattern, not a reused column (different table).
alter table city_services add column if not exists number_of_floors integer;
alter table city_services add column if not exists year_established integer;
alter table city_services add column if not exists languages text[] not null default '{}';

-- ----------------------------------------------------------------------------
-- CITY_SERVICES -- Women's Beauty Salons (women-only) + Men's Barbershops (men-only)
-- Gender exclusivity is enforced at the category level in application code,
-- not by a column here -- there is no unisex value in either CHECK list.
-- ----------------------------------------------------------------------------
alter table city_services add column if not exists salon_type text
  check (salon_type in ('hair_salon', 'nail_salon', 'full_service', 'spa_wellness', 'bridal_studio', 'mobile', 'other'));
alter table city_services add column if not exists shop_type text
  check (shop_type in ('traditional_barbershop', 'modern_grooming', 'barbershop_spa', 'mobile', 'other'));

-- Shared by Salons + Barbershops
alter table city_services add column if not exists staff_count integer;
alter table city_services add column if not exists walk_ins_accepted boolean;
alter table city_services add column if not exists home_service_available boolean;

-- ----------------------------------------------------------------------------
-- PRODUCTS -- Cosmetics / Beauty Products only. Confirmed missing from the
-- live schema. Not added to city_services or any other table -- products
-- remain Women/Men/Unisex/Kids via the existing `gender` column, unrestricted.
-- ----------------------------------------------------------------------------
alter table products add column if not exists size text;

-- ----------------------------------------------------------------------------
-- BUSINESS_JOIN_REQUESTS -- intake mirror
--
-- number_of_floors / year_established / languages already exist on this
-- table (added by 20260811000003 for Hotels, confirmed live) -- deliberately
-- NOT re-added here; only their read/write gate in application code widens
-- to also cover Restaurants/Schools/Universities. Every column below is
-- confirmed genuinely new to this table.
-- ----------------------------------------------------------------------------
alter table business_join_requests add column if not exists restaurant_type text
  check (restaurant_type in ('somali', 'international', 'fast_food', 'cafe_restaurant', 'family', 'fine_dining', 'buffet', 'bakery_restaurant', 'other'));
alter table business_join_requests add column if not exists cuisine text[] not null default '{}';
alter table business_join_requests add column if not exists number_of_tables integer;
alter table business_join_requests add column if not exists online_order_url text;
alter table business_join_requests add column if not exists is_24_hours boolean not null default false;

-- Shared by Restaurants + Cafes
alter table business_join_requests add column if not exists seating_capacity integer;

alter table business_join_requests add column if not exists cafe_type text
  check (cafe_type in ('coffee_shop', 'dessert_cafe', 'study_cafe', 'rooftop_cafe', 'tea_house', 'other'));

alter table business_join_requests add column if not exists school_type text
  check (school_type in ('primary', 'secondary', 'primary_secondary', 'international', 'private', 'public', 'vocational', 'other'));
alter table business_join_requests add column if not exists curriculum text
  check (curriculum in ('somaliland', 'cambridge', 'international', 'arabic', 'islamic', 'other'));
alter table business_join_requests add column if not exists education_levels text[] not null default '{}';
alter table business_join_requests add column if not exists age_range_grades text;
alter table business_join_requests add column if not exists number_of_classrooms integer;

alter table business_join_requests add column if not exists university_type text
  check (university_type in ('public', 'private', 'community_college', 'vocational_institute', 'other'));
alter table business_join_requests add column if not exists degree_levels text[] not null default '{}';
alter table business_join_requests add column if not exists faculties_offered text[] not null default '{}';
alter table business_join_requests add column if not exists number_of_buildings integer;

-- Shared by Schools + Universities -- optional, off by default, no gender split
alter table business_join_requests add column if not exists education_facilities text[] not null default '{}';
alter table business_join_requests add column if not exists number_of_students integer;
alter table business_join_requests add column if not exists number_of_teachers integer;
alter table business_join_requests add column if not exists admissions_open boolean not null default true;
alter table business_join_requests add column if not exists admission_phone text;
alter table business_join_requests add column if not exists admission_whatsapp text;
alter table business_join_requests add column if not exists admission_url text;
alter table business_join_requests add column if not exists application_url text;

alter table business_join_requests add column if not exists salon_type text
  check (salon_type in ('hair_salon', 'nail_salon', 'full_service', 'spa_wellness', 'bridal_studio', 'mobile', 'other'));
alter table business_join_requests add column if not exists shop_type text
  check (shop_type in ('traditional_barbershop', 'modern_grooming', 'barbershop_spa', 'mobile', 'other'));

-- Shared by Salons + Barbershops
alter table business_join_requests add column if not exists staff_count integer;
alter table business_join_requests add column if not exists walk_ins_accepted boolean;
alter table business_join_requests add column if not exists home_service_available boolean;
