-- ============================================================================
-- Go Hargeisa — City Services comprehensive category update
--
-- Final active City Services list: Hospitals, Clinics, Pharmacies, Dental
-- Clinics, Beauty Salons, Men's Barbershops, Schools, Universities,
-- Perfumes, Auto Repair & Car Services.
--
-- 1) Split "Hospitals & Clinics" into two real categories. The existing
--    'hospital' row (1 real published listing: Hargeisa Group Hospital,
--    verified via read-only query) is renamed in place to plain
--    "Hospitals" so that listing stays correctly attached — no
--    category_id migration needed. A new 'clinic' row (singular, avoiding
--    the unique-slug collision with the pre-existing zero-content
--    services-vertical 'clinics' row deactivated below) is added for
--    outpatient/general clinics, per the exact same "singular city_services
--    slug, deactivate the old services-vertical duplicate" pattern already
--    used for Dental Clinics/Perfumes/Auto Repair.
--
-- 2) Pharmacies' Somali name is updated to match the exact wording
--    requested this pass (name/name_ar were already correct).
--
-- 3) Beauty Salons and Men's Barbershops are new. A 'beauty-salons' row
--    already existed under the old services-vertical taxonomy (zero real
--    listings, English-only, verified via read-only query) — reused by
--    deactivating it and creating a proper trilingual city_services
--    version ('beauty-salon', singular, same collision-avoidance
--    reasoning as clinic). No pre-existing barbershop category existed
--    anywhere, so 'men-barbershop' is a clean addition.
--
-- 4) Mosques is removed from City Services per explicit request.
--    Deactivation only — the categories row and its 1 real published
--    listing (FATIMA MOSQUE, verified via read-only query) both stay in
--    the database untouched; only getCategories()'s is_active filter
--    (already read live by the City Services page/filters/admin picker/
--    nav) stops surfacing it.
--
-- Safe to re-run (updates are simple value/flag changes; inserts are
-- idempotent via on conflict).
-- ============================================================================

update categories
set name = 'Hospitals', name_ar = 'المستشفيات', name_so = 'Isbitaallada'
where slug = 'hospital' and target_table = 'city_services';

update categories
set name_so = 'Farmashiyeyaasha'
where slug = 'pharmacy' and target_table = 'city_services';

update categories
set is_active = false
where slug = 'mosque' and target_table = 'city_services';

update categories
set is_active = false
where slug in ('beauty-salons', 'clinics') and target_table = 'services';

insert into categories (slug, name, name_ar, name_so, icon, color, target_table, is_active, is_pinned, sort_order, supports_gallery, supports_new_features, schema_org_type)
values
  ('clinic', 'Clinics', 'العيادات', 'Rugaha Caafimaadka', 'HeartPulse', '#0EA5E9', 'city_services', true, false, 127, false, true, 'MedicalClinic'),
  ('beauty-salon', 'Beauty Salons', 'صالونات التجميل', 'Goobaha Qurxinta', 'Palette', '#DB2777', 'city_services', true, false, 128, true, true, 'BeautySalon'),
  ('men-barbershop', 'Men''s Barbershops', 'صالونات حلاقة الرجال', 'Goobaha Tima-jarista Ragga', 'Scissors', '#1E3A8A', 'city_services', true, false, 129, true, true, 'HairSalon')
on conflict (slug) do nothing;
