-- ============================================================================
-- Go Hargeisa — Listings Upgrade Phase 2: opening-hours closure states
--
-- Adds a 24-Hours toggle and Temporarily/Permanently Closed overrides
-- alongside the existing `opening_hours_structured` day-groups, for the
-- four listing types that currently have a public detail page (hotels,
-- restaurants, cafes, attractions) — matching Phase 1's amenities scoping,
-- events/city_services get this when their own detail-page phases
-- (10/11) stand those routes up, rather than adding unused columns now.
--
-- hotels and attractions never had `opening_hours_structured` at all
-- (hotels default to "no fixed hours configured" rather than a false
-- "Closed" — see components/shared/open-status-badge.tsx, which renders
-- nothing when there's no hours data and no closure override set).
-- ============================================================================

alter table hotels add column if not exists opening_hours_structured jsonb not null default '[]';
alter table hotels add column if not exists is_24_hours boolean not null default false;
alter table hotels add column if not exists temporarily_closed boolean not null default false;
alter table hotels add column if not exists permanently_closed boolean not null default false;

alter table restaurants add column if not exists is_24_hours boolean not null default false;
alter table restaurants add column if not exists temporarily_closed boolean not null default false;
alter table restaurants add column if not exists permanently_closed boolean not null default false;

alter table cafes add column if not exists is_24_hours boolean not null default false;
alter table cafes add column if not exists temporarily_closed boolean not null default false;
alter table cafes add column if not exists permanently_closed boolean not null default false;

alter table attractions add column if not exists opening_hours_structured jsonb not null default '[]';
alter table attractions add column if not exists is_24_hours boolean not null default false;
alter table attractions add column if not exists temporarily_closed boolean not null default false;
alter table attractions add column if not exists permanently_closed boolean not null default false;
