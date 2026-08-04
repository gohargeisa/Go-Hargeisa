-- ============================================================================
-- Go Hargeisa — Listings Upgrade Phase 10: Events public detail page
--
-- Events never had a public route at all — only admin CRUD existed. This
-- brings the table up to the same shape every other upgraded listing type
-- has: slug, coordinates (kept separate from the existing free-text
-- `location` venue description, same pattern as address vs lat/lng
-- elsewhere), gallery/video, hours, contact, and social columns. Amenities
-- (amenities_v2) and rating/review_count were already added in Phases 0/1.
-- No owner_id — events stay admin-authored only, matching city_services.
-- ============================================================================

alter table events add column if not exists slug text;
alter table events add column if not exists lat double precision;
alter table events add column if not exists lng double precision;
alter table events add column if not exists gallery jsonb not null default '[]';
alter table events add column if not exists videos jsonb not null default '[]';
alter table events add column if not exists google_maps_url text;
alter table events add column if not exists opening_hours_structured jsonb not null default '[]';
alter table events add column if not exists is_24_hours boolean not null default false;
alter table events add column if not exists temporarily_closed boolean not null default false;
alter table events add column if not exists permanently_closed boolean not null default false;
alter table events add column if not exists phone text;
alter table events add column if not exists whatsapp text;
alter table events add column if not exists email text;
alter table events add column if not exists website text;
alter table events add column if not exists social_instagram text;
alter table events add column if not exists social_facebook text;
alter table events add column if not exists social_tiktok text;
alter table events add column if not exists social_snapchat text;
alter table events add column if not exists social_x text;
alter table events add column if not exists social_youtube text;
alter table events add column if not exists social_telegram text;
alter table events add column if not exists favorite_count integer not null default 0;

-- Backfill a unique slug from the existing title for any pre-existing rows
-- (a fresh migration on an empty/near-empty table is the common case here,
-- per the low-data-volume note throughout this initiative, but stay safe).
update events set slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || substr(id::text, 1, 8)
where slug is null;
alter table events alter column slug set not null;

alter table events alter column lat set default 9.5624;
alter table events alter column lng set default 44.065;
update events set lat = 9.5624 where lat is null;
update events set lng = 44.065 where lng is null;
alter table events alter column lat set not null;
alter table events alter column lng set not null;

-- schema.sql created a plain (non-unique) events_slug_idx originally;
-- replace it with a unique one now that slug is a real identifier.
drop index if exists events_slug_idx;
create unique index events_slug_idx on events (slug);

-- listing_type = 'event' already exists (Phase 0) — no further trigger work
-- needed for rating/review sync, refresh_listing_rating() already handles it.
