-- ============================================================================
-- Categories — add City Services as a first-class category
--
-- Phase 1 (20260806000001_add_categories_system.sql) modeled the 5 "core
-- vertical" categories (Hotels/Restaurants/Cafes/Attractions/Events) as rows
-- pointing at their own dedicated tables, plus every `services` long-tail
-- category. It left out City Services (the `city_services` table / Smart
-- City Map directory) entirely, since `target_table` didn't allow that
-- value — but City Services is a live, pinned link in today's navbar
-- (site-header.tsx). Phase 2 makes the navbar fully DB-driven off
-- `categories.is_pinned`, so without this row City Services would silently
-- disappear from the nav. Additive: widens the existing check constraint,
-- no data changes to any other table.
-- ============================================================================

alter table categories drop constraint if exists categories_target_table_check;
alter table categories add constraint categories_target_table_check
  check (target_table in ('hotels', 'restaurants', 'cafes', 'attractions', 'events', 'services', 'city_services'));

insert into categories (slug, name, name_ar, name_so, icon, target_table, is_pinned, sort_order)
values
  ('city-services', 'City Services', 'الخدمات المدنية', 'Adeegyada Magaalada', 'Building2', 'city_services', true, 6)
on conflict (slug) do nothing;
