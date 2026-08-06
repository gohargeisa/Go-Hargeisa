-- ============================================================================
-- Go Hargeisa — Unified Category System
--
-- Single source of truth for business categories, replacing the scattered
-- hardcoded config files (lib/utils/service-categories.ts,
-- lib/utils/partner-categories.ts, and friends) with one admin-manageable
-- table that the navbar, homepage, submission form, search, and admin panel
-- can all read from instead of duplicating a category list each.
--
-- Deliberately NOT a full re-architecture of hotels/restaurants/cafes/
-- attractions/events into one polymorphic table — those already have their
-- own dedicated tables, routes, and SEO-indexed URLs, and collapsing them
-- would be a high-risk rewrite touching nearly every file in the app for a
-- site already live in production. Instead:
--   - The 5 "core vertical" categories (Hotels/Restaurants/Cafes/
--     Attractions/Events) are represented here as rows too (so admin can
--     manage their icon/order/pin status in one place), with
--     `target_table` pointing at their real storage table.
--   - Every other category (the long tail: Travel Agencies, Hospitals,
--     Flower Shops, Real Estate, etc.) is backed by the existing `services`
--     table, which was already built for exactly this ("one shared shape
--     across all N categories" — see 20260729000001_add_services.sql).
--     `services.category_id` (added below) is the new source of truth;
--     `services.category` (the old enum) is left in place, not dropped —
--     additive and reversible, not a destructive migration.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_ar text,
  name_so text,
  description text,
  description_ar text,
  description_so text,
  -- lucide-react icon export name (e.g. "Hotel", "Flower2") — resolved to a
  -- component client-side via lib/utils/dynamic-icon.tsx, never stored as code.
  icon text not null default 'Building2',
  -- Optional hex accent for the category's badge/card (e.g. "#F59E0B").
  color text,
  -- Which table actually stores this category's listings.
  target_table text not null default 'services'
    check (target_table in ('hotels', 'restaurants', 'cafes', 'attractions', 'events', 'services')),
  is_active boolean not null default true,
  -- Pinned categories render directly in the navbar; unpinned ones live
  -- under the "More" mega-menu. Independent of is_active so an admin can
  -- unpin without deactivating.
  is_pinned boolean not null default false,
  sort_order integer not null default 0,
  -- Extra search terms so a free-text query like "ATM" or "gas station"
  -- resolves to the right category even when a business's real name
  -- doesn't contain that word — see lib/data/categories.ts matchCategoryFromQuery.
  search_keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_categories_target_table on categories(target_table);
create index if not exists idx_categories_is_active on categories(is_active);
create index if not exists idx_categories_is_pinned on categories(is_pinned);
create index if not exists idx_categories_sort_order on categories(sort_order);

alter table categories enable row level security;

drop policy if exists "Public can read active categories" on categories;
create policy "Public can read active categories" on categories
  for select using (is_active = true);

-- Admins need to see inactive/hidden categories too (the admin list page
-- shows everything, not just what's publicly active) — matches the
-- services table's "Owners manage services" policy shape exactly.
drop policy if exists "Owners manage categories" on categories;
create policy "Owners manage categories" on categories for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

-- ----------------------------------------------------------------------------
-- Seed: the 5 core verticals, pinned in the navbar (matches today's
-- site-header.tsx hardcoded link order exactly, so nav output is unchanged
-- the moment the nav is rewired to read from this table).
-- ----------------------------------------------------------------------------
insert into categories (slug, name, name_ar, name_so, icon, target_table, is_pinned, sort_order)
values
  ('hotels', 'Hotels', 'الفنادق', 'Hudheelada', 'Hotel', 'hotels', true, 1),
  ('restaurants', 'Restaurants', 'المطاعم', 'Maqaayadaha', 'UtensilsCrossed', 'restaurants', true, 2),
  ('cafes', 'Cafes', 'المقاهي', 'Kafateeriyada', 'Coffee', 'cafes', true, 3),
  ('attractions', 'Attractions', 'الأماكن السياحية', 'Meelaha Xiisaha leh', 'MapPin', 'attractions', true, 4),
  ('events', 'Events', 'الفعاليات', 'Munaasabadaha', 'CalendarDays', 'events', false, 5)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- Seed: every existing `service_category` enum value, so migrating
-- `services.category_id` below has a matching row for each. Slugs match the
-- LIVE, SEO-indexed /services/<slug> URLs exactly (see the pre-existing
-- lib/utils/service-categories.ts SERVICE_CATEGORY_SLUGS, which this table
-- now supersedes as the source of truth) — NOT the raw enum values, so no
-- existing indexed URL changes when routes are rewired to read from here.
-- ----------------------------------------------------------------------------
insert into categories (slug, name, icon, color, target_table, is_pinned, sort_order, search_keywords)
values
  ('hospitals', 'Hospitals', 'Stethoscope', '#EF4444', 'services', false, 10, array['hospital','hospitals','clinic','medical','health']),
  ('pharmacies', 'Pharmacies', 'Pill', '#EC4899', 'services', false, 11, array['pharmacy','pharmacies','chemist','drugstore','medicine']),
  ('dental-clinics', 'Dental Clinics', 'Smile', '#F43F5E', 'services', false, 12, array['dental','dentist','dental clinic','teeth']),
  ('banks', 'Banks', 'Building2', '#2563EB', 'services', false, 13, array['bank','banks','banking']),
  ('atms', 'ATMs', 'Wallet', '#14B8A6', 'services', false, 14, array['atm','atms','cash machine','cash point']),
  ('currency-exchange', 'Currency Exchange', 'CreditCard', '#CA8A04', 'services', false, 15, array['currency exchange','money exchange','exchange','forex']),
  ('gas-stations', 'Gas Stations', 'Fuel', '#F97316', 'services', false, 16, array['gas station','gas','petrol','fuel','filling station']),
  ('car-rentals', 'Car Rental', 'Car', '#7C3AED', 'services', false, 17, array['car rental','car rentals','rent a car','car hire']),
  ('mosques', 'Mosques', 'MoonStar', '#0D9488', 'services', false, 18, array['mosque','mosques','masjid','jaamac']),
  ('schools', 'Schools', 'School', '#22C55E', 'services', false, 19, array['school','schools','primary school','secondary school']),
  ('universities', 'Universities', 'GraduationCap', '#059669', 'services', false, 20, array['university','universities','college']),
  ('gyms', 'Sports Clubs', 'Dumbbell', '#DC2626', 'services', false, 21, array['gym','gyms','fitness','fitness center','workout']),
  ('tour-companies', 'Travel Agencies', 'Map', '#0891B2', 'services', false, 22, array['tour company','tour companies','tours','travel agency','tour operator']),
  ('apartments', 'Apartments', 'Building', '#9333EA', 'services', false, 23, array['apartment','apartments','flat','flats','furnished apartment']),
  ('supermarkets', 'Shopping', 'ShoppingCart', '#8B5CF6', 'services', false, 24, array['supermarket','supermarkets','grocery','grocery store','market']),
  ('clinics', 'Clinics', 'HeartPulse', '#F472B6', 'services', false, 25, array['clinic','clinics','medical clinic','walk-in clinic']),
  ('government-offices', 'Government Offices', 'Landmark', '#4F46E5', 'services', false, 26, array['government office','government offices','ministry','municipality','government'])
on conflict (slug) do nothing;

-- New long-tail categories from the requested list that had no prior
-- service_category enum value at all.
insert into categories (slug, name, icon, color, target_table, is_pinned, sort_order, search_keywords)
values
  ('flower-shops', 'Flower Shops', 'Flower2', '#DB2777', 'services', false, 27, array['flower','flowers','florist','flower shop']),
  ('real-estate', 'Real Estate', 'Home', '#0369A1', 'services', false, 28, array['real estate','property','realtor','housing']),
  ('electronics', 'Electronics', 'Laptop', '#4338CA', 'services', false, 29, array['electronics','computer','phone shop','gadgets']),
  ('transportation', 'Transportation', 'Bus', '#EA580C', 'services', false, 30, array['transportation','bus','transit','taxi']),
  ('beauty-salons', 'Beauty Salons', 'Sparkles', '#C026D3', 'services', false, 31, array['beauty salon','salon','barber','spa','hair'])
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- Link `services` to the new table. Additive: the old `category` enum
-- column stays put (not dropped), so nothing that still reads it breaks.
-- ----------------------------------------------------------------------------
alter table services add column if not exists category_id uuid references categories(id);
create index if not exists idx_services_category_id on services(category_id);

-- Old enum value -> new slug, since the enum values (e.g. 'hospital') no
-- longer match the categories.slug values (e.g. 'hospitals') one-for-one.
update services s
set category_id = c.id
from categories c
where s.category_id is null
  and c.target_table = 'services'
  and c.slug = case s.category::text
    when 'hospital' then 'hospitals'
    when 'pharmacy' then 'pharmacies'
    when 'dental_clinic' then 'dental-clinics'
    when 'bank' then 'banks'
    when 'atm' then 'atms'
    when 'currency_exchange' then 'currency-exchange'
    when 'gas_station' then 'gas-stations'
    when 'car_rental' then 'car-rentals'
    when 'mosque' then 'mosques'
    when 'school' then 'schools'
    when 'university' then 'universities'
    when 'gym' then 'gyms'
    when 'tour_company' then 'tour-companies'
    when 'apartment' then 'apartments'
    when 'supermarket' then 'supermarkets'
    when 'clinic' then 'clinics'
    when 'government_office' then 'government-offices'
    else null
  end;

comment on column services.category is
  'Deprecated — superseded by category_id (see categories table). Left in place for backward compatibility, not dropped.';

-- The long-tail categories added above (flower-shops, real-estate,
-- electronics, transportation, beauty-salons) have no matching
-- service_category enum value — adding one requires recreating the type.
-- Rather than block admins from creating listings in a genuinely new
-- category, the legacy column becomes optional: new/edited rows going
-- forward only set category_id, leaving `category` null when there's no
-- enum value to map to.
alter table services alter column category drop not null;
