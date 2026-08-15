-- ============================================================================
-- Go Hargeisa — Add "Institutes" City Services category
--
-- Completes the Education grouping alongside the existing Schools,
-- Universities, and English Language Institutes (the latter already live in
-- production with a real listing — "English Excellence Academy" — but with
-- no corresponding migration file in this repo; that pre-existing row is
-- left untouched here). "Institutes" covers professional/technical/
-- vocational training institutes that are neither a school, a university,
-- nor a language institute.
--
-- No new typed columns: unlike School/University, no institute-specific
-- registration fields have been requested or captured yet, so this reuses
-- every generic city_services field (name, description, gallery, hours,
-- contact, location) exactly as every other category does before it grows
-- category-specific fields. supports_products/supports_appointments stay
-- false — neither engine applies to a generic institute listing.
--
-- sort_order 132 continues directly after English Language Institutes (131,
-- the current highest city_services sort_order in production).
-- ============================================================================

insert into categories (
  slug, name, name_ar, name_so, icon, color, target_table, is_active, is_pinned,
  sort_order, supports_gallery, supports_new_features, schema_org_type
)
values (
  'institute',
  'Institutes',
  'المعاهد',
  'Machadyada',
  'BookOpen',
  '#7C3AED',
  'city_services',
  true,
  false,
  132,
  true,
  true,
  'EducationalOrganization'
)
on conflict (slug) do nothing;
