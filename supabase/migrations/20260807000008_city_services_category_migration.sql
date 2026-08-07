-- ============================================================================
-- Go Hargeisa — Category architecture redesign, step 2: City Services
-- becomes real `categories` rows
--
-- Seeds one `categories` row per value in the hardcoded city_service_category
-- enum / lib/config/city-service-categories.ts (target_table='city_services',
-- is_pinned=false so they never compete with the single "City Services" nav
-- entry, sort_order 100+ to stay clear of every existing row). Names copied
-- verbatim from the existing categoryLabel_* translations in
-- messages/{en,so,ar}.json so displayed labels don't change. Icons/colors
-- match the existing hardcoded config where one already existed for that
-- concept.
--
-- Also reconciles the real duplication this surfaced: 10 of these same
-- real-world categories (hospital, pharmacy, bank, mosque, school,
-- university, gym, car_rental, gas_station, government_office) already
-- existed as a SEPARATE, zero-content `services`-vertical category row
-- each (verified via read-only production query before writing this
-- migration — all 10 have 0 real services listings). City Services becomes
-- the one real home for these going forward; the old services-vertical
-- rows are deactivated (is_active=false, reversible, same pattern as the
-- supermarkets category deactivated in 20260807000006). 6 other
-- services-vertical categories checked at the same time (apartments, atms,
-- clinics, currency-exchange, dental-clinics, tour-companies) have NO
-- city_services counterpart at all and are left untouched.
--
-- Safe to re-run (every insert/update is idempotent).
-- ============================================================================

insert into categories (slug, name, name_ar, name_so, icon, color, target_table, is_active, is_pinned, sort_order, supports_gallery, supports_new_features, schema_org_type)
values
  ('hospital', 'Hospitals & Clinics', 'المستشفيات والعيادات', 'Isbitaallada iyo Xarumaha Caafimaadka', 'Stethoscope', '#EF4444', 'city_services', true, false, 100, false, false, 'Hospital'),
  ('pharmacy', 'Pharmacies', 'الصيدليات', 'Farmashiyada', 'Pill', '#EC4899', 'city_services', true, false, 101, false, false, 'Pharmacy'),
  ('gas-station', 'Gas Stations', 'محطات الوقود', 'Xarumaha Shidaalka', 'Fuel', '#F97316', 'city_services', true, false, 102, false, true, 'GasStation'),
  ('bank', 'Banks & ATMs', 'البنوك وأجهزة الصراف الآلي', 'Bangiyada iyo ATM-yada', 'Building2', '#2563EB', 'city_services', true, false, 103, false, false, 'BankOrCreditUnion'),
  ('mosque', 'Mosques', 'المساجد', 'Masaajidada', 'MoonStar', '#0D9488', 'city_services', true, false, 104, false, false, 'PlaceOfWorship'),
  ('park-playground', 'Parks & Playgrounds', 'الحدائق والملاعب', 'Beeraha iyo Goobaha Ciyaarta', 'Trees', '#16A34A', 'city_services', true, false, 105, true, true, null),
  ('kids-family', 'Kids & Family', 'الأطفال والعائلة', 'Carruurta iyo Qoyska', 'Baby', '#F59E0B', 'city_services', true, false, 106, true, true, null),
  ('supermarket', 'Supermarkets', 'السوبر ماركت', 'Dukaannada Waaweyn', 'ShoppingCart', '#8B5CF6', 'city_services', true, false, 107, false, true, 'GroceryStore'),
  ('taxi-service', 'Taxi Services', 'خدمات التاكسي', 'Adeegyada Taksiga', 'CarTaxiFront', '#FACC15', 'city_services', true, false, 108, false, true, null),
  ('police-station', 'Police Stations', 'مراكز الشرطة', 'Xarumaha Booliska', 'Shield', '#1D4ED8', 'city_services', true, false, 109, false, true, 'PoliceStation'),
  ('fire-station', 'Fire Stations', 'مراكز الإطفاء', 'Xarumaha Dab-damiska', 'Flame', '#DC2626', 'city_services', true, false, 110, false, true, 'FireStation'),
  ('electricity-service', 'Electricity Services', 'خدمات الكهرباء', 'Adeegyada Korontada', 'Zap', '#EAB308', 'city_services', true, false, 111, false, true, null),
  ('water-service', 'Water Services', 'خدمات المياه', 'Adeegyada Biyaha', 'Droplet', '#0EA5E9', 'city_services', true, false, 112, false, true, null),
  ('post-office', 'Post Offices', 'مكاتب البريد', 'Xafiisyada Boostada', 'Mail', '#6366F1', 'city_services', true, false, 113, false, true, 'PostOffice'),
  ('school', 'Schools', 'المدارس', 'Dugsiyada', 'School', '#22C55E', 'city_services', true, false, 114, false, true, 'School'),
  ('university', 'Universities', 'الجامعات', 'Jaamacadaha', 'GraduationCap', '#059669', 'city_services', true, false, 115, false, true, 'CollegeOrUniversity'),
  ('sports-club', 'Sports Clubs', 'الأندية الرياضية', 'Naadiyada Isboortiga', 'Trophy', '#D97706', 'city_services', true, false, 116, true, true, null),
  ('gym', 'Gyms', 'صالات رياضية', 'Jimicsiga', 'Dumbbell', '#DC2626', 'city_services', true, false, 117, true, true, 'ExerciseGym'),
  ('car-rental', 'Car Rental', 'تأجير السيارات', 'Kirada Baabuurta', 'Car', '#7C3AED', 'city_services', true, false, 118, true, true, 'AutoRental'),
  ('car-wash', 'Car Wash', 'غسيل السيارات', 'Dhaqidda Baabuurta', 'SprayCan', '#06B6D4', 'city_services', true, false, 119, true, true, null),
  ('ev-charging', 'EV Charging Stations', 'محطات شحن السيارات الكهربائية', 'Xarumaha Sheegista Baabuurta Korontada', 'BatteryCharging', '#10B981', 'city_services', true, false, 120, false, true, null),
  ('government-office', 'Government Offices', 'المكاتب الحكومية', 'Xafiisyada Dawladda', 'Briefcase', '#4F46E5', 'city_services', true, false, 121, false, true, null),
  ('visa-immigration', 'Visa & Immigration Offices', 'مكاتب التأشيرات والهجرة', 'Xafiisyada Fiisaha iyo Socdaalka', 'FileCheck', '#0369A1', 'city_services', true, false, 122, false, true, null),
  ('internet-telecom', 'Internet & Telecom Providers', 'مزودو الإنترنت والاتصالات', 'Bixiyeyaasha Internet-ka iyo Isgaadhsiinta', 'Wifi', '#4338CA', 'city_services', true, false, 123, false, true, null)
on conflict (slug) do nothing;

-- Backfill category_id on every existing city_services row from its legacy
-- enum value. The CASE covers all 24 possible enum values, so no row can be
-- left unmatched.
update city_services cs
set category_id = c.id
from categories c
where c.target_table = 'city_services'
  and c.is_pinned = false
  and c.slug = case cs.category::text
    when 'hospital' then 'hospital'
    when 'pharmacy' then 'pharmacy'
    when 'gas_station' then 'gas-station'
    when 'bank' then 'bank'
    when 'mosque' then 'mosque'
    when 'park_playground' then 'park-playground'
    when 'kids_family' then 'kids-family'
    when 'supermarket' then 'supermarket'
    when 'taxi_service' then 'taxi-service'
    when 'police_station' then 'police-station'
    when 'fire_station' then 'fire-station'
    when 'electricity_service' then 'electricity-service'
    when 'water_service' then 'water-service'
    when 'post_office' then 'post-office'
    when 'school' then 'school'
    when 'university' then 'university'
    when 'sports_club' then 'sports-club'
    when 'gym' then 'gym'
    when 'car_rental' then 'car-rental'
    when 'car_wash' then 'car-wash'
    when 'ev_charging' then 'ev-charging'
    when 'government_office' then 'government-office'
    when 'visa_immigration' then 'visa-immigration'
    when 'internet_telecom' then 'internet-telecom'
  end
  and cs.category_id is null;

alter table city_services alter column category_id set not null;

-- Deactivate the 10 zero-content services-vertical categories that
-- duplicate a real-world concept City Services now owns. Reversible
-- (is_active flip only), no schema change, no real listings affected.
update categories
set is_active = false
where target_table = 'services'
  and slug in ('hospitals', 'pharmacies', 'banks', 'mosques', 'schools', 'universities', 'gyms', 'car-rentals', 'gas-stations', 'government-offices');

-- Preserve current gallery-eligibility exactly for the 2 remaining active
-- services-vertical categories that had it under the old
-- serviceCategorySupportsGallery() allow-list (car_rental/gym are now
-- deactivated above, so only these 2 of the original 4 still need it).
update categories
set supports_gallery = true
where target_table = 'services' and slug in ('tour-companies', 'apartments');
