-- ============================================================================
-- Go Hargeisa — Add "Auto Repair & Car Services" as a City Services category
--
-- Follows the exact shape/singular-slug convention used by every other
-- city_services row (see 20260807000008 / 20260808000001). Its matching
-- city_service_category enum value ('auto_repair') was added in the
-- previous migration, so createCityService() can write real listings under
-- it immediately. Explicitly NOT added to Supermarkets or any other
-- existing category — a standalone row, target_table='city_services'.
--
-- Safe to re-run (insert is idempotent via on conflict).
-- ============================================================================

insert into categories (slug, name, name_ar, name_so, icon, color, target_table, is_active, is_pinned, sort_order, supports_gallery, supports_new_features, schema_org_type)
values
  ('auto-repair', 'Auto Repair & Car Services', 'ورش تصليح السيارات', 'Goobaha Dayactirka Baabuurta', 'Wrench', '#64748B', 'city_services', true, false, 126, false, true, 'AutoRepair')
on conflict (slug) do nothing;
