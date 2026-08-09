-- ============================================================================
-- Go Hargeisa — City Services owner-read RLS policy
--
-- 20260809000001_city_services_owner_id.sql added owner_id to city_services
-- plus an owner-scoped UPDATE policy, but no owner-scoped SELECT policy —
-- so an assigned owner (e.g. Ahmed Dhaad on "Pinnacle perfumes and
-- cosmatics") could not read their own listing via the API if it were ever
-- unpublished/draft (the public SELECT policy only allows status =
-- 'published'). This adds the missing read policy, mirroring the existing
-- UPDATE policy exactly. Purely additive: RLS policies for the same command
-- are OR'd together, so this cannot remove access from any existing reader.
-- Idempotent (drop-if-exists before create), safe to re-run.
-- ============================================================================

drop policy if exists "city_services_owner_select" on city_services;
create policy "city_services_owner_select" on city_services
  for select
  using (owner_id = auth.uid());
