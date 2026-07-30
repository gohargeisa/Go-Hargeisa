-- ============================================================================
-- Go Hargeisa — Phase 4 Stage 5: City Services featured + description
-- Adds the two fields the original Phase 2 city_services table never had:
-- a short description (shown on the public card) and a featured flag.
-- "Featured" is the mechanism behind "maximum 4 per category" — the public
-- page now shows only featured+published rows (see lib/data/city-services.ts),
-- so an owner can keep more than 4 rows per category in reserve (e.g.
-- swapping which 4 are live) without deleting anything. The 4-per-category
-- cap on `featured` is enforced in the server action (lib/actions/
-- city-services.ts), not a DB constraint — this is a same-role business
-- rule the owner applies to their own data, not a security boundary between
-- roles (unlike partner_status, which needed a DB trigger because a
-- *different*, less-trusted role could otherwise bypass it).
-- Both new columns are nullable/defaulted so every existing row keeps
-- working: description defaults to null (nothing fabricated), featured
-- defaults to false (an existing published row doesn't suddenly appear
-- "featured" without the owner explicitly choosing it).
-- Safe to re-run.
-- ============================================================================

alter table city_services add column if not exists description text;
alter table city_services add column if not exists featured boolean not null default false;

create index if not exists idx_city_services_featured on city_services (category, featured);
