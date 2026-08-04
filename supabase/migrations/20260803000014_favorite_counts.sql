-- ============================================================================
-- Go Hargeisa — Listings Upgrade Phase 7: denormalized favorite counts
--
-- Adds a `favorite_count` column to every listing table that participates
-- in favorites today (hotel/restaurant/cafe/attraction/service), synced by
-- a trigger on the `favorites` table — same pattern as
-- refresh_listing_rating() (schema.sql:439-462) for reviews.
-- ============================================================================

alter table hotels add column if not exists favorite_count integer not null default 0;
alter table restaurants add column if not exists favorite_count integer not null default 0;
alter table cafes add column if not exists favorite_count integer not null default 0;
alter table attractions add column if not exists favorite_count integer not null default 0;
alter table services add column if not exists favorite_count integer not null default 0;

create or replace function refresh_favorite_count() returns trigger as $$
declare
  v_listing_type listing_type;
  v_listing_id uuid;
  target_table text;
begin
  if tg_op = 'DELETE' then
    v_listing_type := old.listing_type;
    v_listing_id := old.listing_id;
  else
    v_listing_type := new.listing_type;
    v_listing_id := new.listing_id;
  end if;

  target_table := case v_listing_type
    when 'hotel' then 'hotels'
    when 'restaurant' then 'restaurants'
    when 'cafe' then 'cafes'
    when 'attraction' then 'attractions'
    when 'service' then 'services'
    else null
  end;

  if target_table is not null then
    execute format(
      'update %I set favorite_count = (select count(*) from favorites where listing_type = $1 and listing_id = $2)
       where id = $2', target_table
    ) using v_listing_type, v_listing_id;
  end if;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists on_favorite_change on favorites;
create trigger on_favorite_change
  after insert or delete on favorites
  for each row execute function refresh_favorite_count();

-- Backfill existing rows.
update hotels h set favorite_count = (select count(*) from favorites where listing_type = 'hotel' and listing_id = h.id);
update restaurants r set favorite_count = (select count(*) from favorites where listing_type = 'restaurant' and listing_id = r.id);
update cafes c set favorite_count = (select count(*) from favorites where listing_type = 'cafe' and listing_id = c.id);
update attractions a set favorite_count = (select count(*) from favorites where listing_type = 'attraction' and listing_id = a.id);
update services s set favorite_count = (select count(*) from favorites where listing_type = 'service' and listing_id = s.id);
