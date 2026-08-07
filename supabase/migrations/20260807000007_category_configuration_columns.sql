-- ============================================================================
-- Go Hargeisa — Category architecture redesign, step 1: configuration columns
--
-- Adds the per-category configuration this codebase currently scatters
-- across 3 hardcoded TS files (lib/config/gallery-eligibility.ts,
-- lib/config/listing-feature-eligibility.ts, and city-services/page.tsx's
-- CATEGORY_SCHEMA_TYPE map) directly onto the `categories` table, so it can
-- be read from one place instead of three. Also adds the FK that lets
-- `city_services` join the same `categories` table every other listing
-- table already uses, instead of its own separate, hardcoded
-- city_service_category enum taxonomy (lib/config/city-service-categories.ts).
--
-- Defaults below reproduce today's exact hardcoded behavior for every
-- EXISTING category row — nothing changes visually until the follow-up
-- migration (20260807000008) explicitly seeds different values. Safe to
-- re-run.
-- ============================================================================

alter table categories
  add column if not exists supports_gallery boolean not null default false,
  add column if not exists supports_new_features boolean not null default true,
  add column if not exists schema_org_type text;

comment on column categories.supports_gallery is
  'Replaces lib/config/gallery-eligibility.ts. Whether listings under this category get the multi-image gallery UI (vs. a single cover photo only).';
comment on column categories.supports_new_features is
  'Replaces lib/config/listing-feature-eligibility.ts. Whether listings under this category show reviews/opening-hours badge/amenities/video gallery/social links.';
comment on column categories.schema_org_type is
  'Replaces city-services/page.tsx''s hardcoded CATEGORY_SCHEMA_TYPE map. schema.org @type for JSON-LD (e.g. "Hospital", "Pharmacy"). NULL falls back to "LocalBusiness".';

alter table city_services
  add column if not exists category_id uuid references categories(id) on delete set null;

comment on column city_services.category_id is
  'Real source of truth for a city service''s category — references categories(id) where target_table=''city_services''. The legacy `category` enum column is kept (deprecated, unused after backfill) for backward compat, same pattern as services.category.';

create index if not exists city_services_category_id_idx on city_services (category_id);
