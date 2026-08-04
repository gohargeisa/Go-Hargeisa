-- ============================================================================
-- Go Hargeisa — Listings Upgrade Phase 11: City Services public detail page
--
-- city_services had no public detail route at all — only the card grid on
-- /city-services. Brings it up to the same shape as every other upgraded
-- listing type: slug, coordinates, structured hours (keeping the existing
-- free-text `opening_hours` as a fallback for rows not yet migrated to
-- structured hours), the remaining social platforms, video, and favorite
-- count. amenities_v2/rating/review_count were already added in Phases 0/1.
-- No owner_id — admin-authored only, same as events.
-- ============================================================================

alter table city_services add column if not exists slug text;
alter table city_services add column if not exists lat double precision;
alter table city_services add column if not exists lng double precision;
alter table city_services add column if not exists videos jsonb not null default '[]';
alter table city_services add column if not exists opening_hours_structured jsonb not null default '[]';
alter table city_services add column if not exists is_24_hours boolean not null default false;
alter table city_services add column if not exists temporarily_closed boolean not null default false;
alter table city_services add column if not exists permanently_closed boolean not null default false;
alter table city_services add column if not exists social_instagram text;
alter table city_services add column if not exists social_facebook text;
alter table city_services add column if not exists social_tiktok text;
alter table city_services add column if not exists social_snapchat text;
alter table city_services add column if not exists social_x text;
alter table city_services add column if not exists social_youtube text;
alter table city_services add column if not exists social_telegram text;
alter table city_services add column if not exists favorite_count integer not null default 0;

-- Backfill a unique slug from the existing name for any pre-existing rows.
update city_services set slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || substr(id::text, 1, 8)
where slug is null;
alter table city_services alter column slug set not null;
create unique index if not exists city_services_slug_idx on city_services (slug);

-- Every city_services row needs coordinates for it to ever appear in
-- "Nearby Places" or get a "Get Directions" button — default to central
-- Hargeisa for any pre-existing row without one (an admin can correct the
-- pin later; this only affects rows created before this migration).
alter table city_services alter column lat set default 9.5624;
alter table city_services alter column lng set default 44.065;
update city_services set lat = 9.5624 where lat is null;
update city_services set lng = 44.065 where lng is null;
alter table city_services alter column lat set not null;
alter table city_services alter column lng set not null;
