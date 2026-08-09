-- ============================================================================
-- Go Hargeisa — City Services ownership
-- Adds the same owner_id + business-owner-scoped-UPDATE pattern already used
-- by hotels/restaurants/cafes/services (see 20260729000001_add_services.sql)
-- to city_services, so an admin can assign an individual business owner to a
-- specific City Services listing (hospital, clinic, pharmacy, school,
-- university, mosque, supermarket, gas station, sports club, ...) and that
-- owner can then manage only that listing. Nullable column — every existing
-- row gets owner_id = null, no data rewritten. Safe to re-run.
-- ============================================================================

alter table city_services add column if not exists owner_id uuid references profiles(id);
create index if not exists idx_city_services_owner_id on city_services(owner_id);

drop policy if exists "Owners manage their city services" on city_services;
create policy "Owners manage their city services" on city_services for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
