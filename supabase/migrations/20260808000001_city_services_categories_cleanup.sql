-- ============================================================================
-- Go Hargeisa — City Services category cleanup: separate Supermarkets out,
-- add Dental Clinics and Perfumes
--
-- 1) Supermarkets must never be a City Services category. The
--    20260807000008 migration accidentally seeded one (slug='supermarket',
--    target_table='city_services') alongside the other 23 essential-service
--    categories — Supermarket is a deliberately independent top-level
--    module (see docs/supermarket-architecture.md; nav already links
--    straight to /supermarket, gated by SUPERMARKET_ENABLED, never through
--    the categories table). Deactivating (not deleting — same reversible
--    pattern as 20260807000006/20260807000006) removes it from the City
--    Services page/admin picker via getCategories()'s is_active filter.
--    Verified via read-only query before writing this migration: zero
--    city_services rows reference this category_id, so no listing data is
--    hidden or orphaned by this change.
--
-- 2) Dental Clinics and Perfumes are added as real City Services
--    categories, following the exact same shape/singular-slug convention
--    as every other row seeded in 20260807000008. 'dental-clinics' (plural)
--    is already taken by the separate, zero-content `services`-vertical
--    category of the same name (see step 3), so 'dental-clinic' (singular)
--    is used here — matching the singular-slug pattern every other
--    city_services row already uses (hospital, pharmacy, mosque, school,
--    university, ...) specifically to avoid colliding with the pre-existing
--    plural services-vertical slugs.
--
-- 3) The old services-vertical 'dental-clinics' category (zero real
--    listings, verified via read-only query) is deactivated for the same
--    reason the 10 overlapping services-vertical categories were
--    deactivated in 20260807000008 — Dental Clinics now has one real home
--    (City Services), not two competing ones.
--
-- Safe to re-run (every insert is idempotent via on conflict; updates are
-- simple flag flips).
-- ============================================================================

update categories
set is_active = false
where slug = 'supermarket' and target_table = 'city_services';

insert into categories (slug, name, name_ar, name_so, icon, color, target_table, is_active, is_pinned, sort_order, supports_gallery, supports_new_features, schema_org_type)
values
  ('dental-clinic', 'Dental Clinics', 'عيادات الأسنان', 'Rugaha Ilkaha', 'Smile', '#14B8A6', 'city_services', true, false, 124, false, true, 'Dentist'),
  ('perfume-shop', 'Perfumes', 'العطور', 'Cadarro', 'Sparkles', '#D946EF', 'city_services', true, false, 125, false, true, null)
on conflict (slug) do nothing;

update categories
set is_active = false
where slug = 'dental-clinics' and target_table = 'services';
