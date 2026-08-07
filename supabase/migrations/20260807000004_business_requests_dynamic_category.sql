-- ============================================================================
-- Go Hargeisa — Dynamic category support for business join requests
--
-- Lets non-hotel/restaurant/cafe /join submissions carry a real category
-- reference (the `categories` table, target_table='services') plus arbitrary
-- per-category field values, so convertJoinRequest can build a `services`
-- insert instead of being limited to the 3 hardcoded tables it already
-- supports. The existing `category` (partner_request_category) enum column
-- is left untouched — every dynamically-categorized submission keeps storing
-- 'other' there; category_id is the real source of truth for which
-- services-vertical category it actually is. Safe to re-run.
-- ============================================================================

alter table business_join_requests
  add column if not exists category_id uuid references categories(id) on delete set null,
  add column if not exists custom_fields jsonb not null default '{}'::jsonb;

comment on column business_join_requests.category_id is
  'Set only when category = ''other'' — references the categories table row (target_table=''services'') this request is actually for. NULL for hotel/restaurant/cafe requests, which stay fully described by the category enum column.';
comment on column business_join_requests.custom_fields is
  'Per-category custom field values submitted on /join, matching the referenced category''s custom_fields_schema. Copied verbatim into services.custom_fields on conversion.';

create index if not exists business_join_requests_category_id_idx on business_join_requests (category_id);
