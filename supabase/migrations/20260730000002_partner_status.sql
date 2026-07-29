-- ============================================================================
-- Go Hargeisa — Phase 2: Partner Status (Trial Partner / Official Partner)
-- Trial partners: listing is live and visible on the public site, but the
-- linked business owner (if any) has no dashboard access yet. Official
-- partners: the linked business owner gets full /business dashboard access.
--
-- Backfill note: every hotel/restaurant/cafe that ALREADY has an owner_id
-- set today is already receiving working dashboard access (via the
-- existing role=business_owner + owner_id-match mechanism) — those are
-- backfilled to 'official' so this migration cannot silently revoke access
-- that was already functioning before Partner Status existed. Only newly
-- linked owners default to 'trial' going forward.
--
-- "Owner only can change status" is enforced at the database level, not
-- just hidden from the UI: a trigger reverts any change to partner_status
-- unless the acting session's profile role is 'owner', so a business_owner
-- calling the API directly still can't self-promote. Safe to re-run.
-- ============================================================================

do $$ begin
  create type partner_status as enum ('trial', 'official');
exception when duplicate_object then null;
end $$;

alter table hotels add column if not exists partner_status partner_status not null default 'trial';
alter table restaurants add column if not exists partner_status partner_status not null default 'trial';
alter table cafes add column if not exists partner_status partner_status not null default 'trial';

update hotels set partner_status = 'official' where owner_id is not null and partner_status = 'trial';
update restaurants set partner_status = 'official' where owner_id is not null and partner_status = 'trial';
update cafes set partner_status = 'official' where owner_id is not null and partner_status = 'trial';

create index if not exists idx_hotels_partner_status on hotels(partner_status);
create index if not exists idx_restaurants_partner_status on restaurants(partner_status);
create index if not exists idx_cafes_partner_status on cafes(partner_status);

create or replace function enforce_partner_status_owner_only() returns trigger as $$
begin
  if new.partner_status is distinct from old.partner_status then
    if not exists (select 1 from profiles where id = auth.uid() and role = 'owner') then
      new.partner_status := old.partner_status;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_enforce_partner_status_hotels on hotels;
create trigger trg_enforce_partner_status_hotels
  before update on hotels
  for each row execute procedure enforce_partner_status_owner_only();

drop trigger if exists trg_enforce_partner_status_restaurants on restaurants;
create trigger trg_enforce_partner_status_restaurants
  before update on restaurants
  for each row execute procedure enforce_partner_status_owner_only();

drop trigger if exists trg_enforce_partner_status_cafes on cafes;
create trigger trg_enforce_partner_status_cafes
  before update on cafes
  for each row execute procedure enforce_partner_status_owner_only();
