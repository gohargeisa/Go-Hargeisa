-- ============================================================================
-- Go Hargeisa — Listings Upgrade Phase 0b: rating columns + trigger wiring
-- for Events and City Services
--
-- Runs after 20260803000007 has committed its 'event'/'city_service' enum
-- additions, so it's safe to reference those values here. Adds the same
-- rating/review_count columns every other listing_type target already has
-- (hotels/restaurants/cafes/attractions/services), and extends
-- refresh_listing_rating() (as last redefined in 20260802000001_reviews_
-- moderation_fix.sql) with the two new CASE branches so reviews against an
-- event or city_service row sync rating/review_count exactly like every
-- other listing type. The function already no-ops (rather than crashes) on
-- unmapped types, so this was never a hard blocker for reviews to exist —
-- just for the rating/review_count aggregate to actually update.
-- ============================================================================

alter table events add column if not exists rating numeric(2,1) not null default 0;
alter table events add column if not exists review_count integer not null default 0;
alter table city_services add column if not exists rating numeric(2,1) not null default 0;
alter table city_services add column if not exists review_count integer not null default 0;

create or replace function refresh_listing_rating() returns trigger as $$
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
    when 'event' then 'events'
    when 'city_service' then 'city_services'
    else null
  end;

  if target_table is not null then
    execute format(
      'update %I set rating = coalesce((select round(avg(rating)::numeric,1) from reviews where listing_type = $1 and listing_id = $2),0),
                review_count = (select count(*) from reviews where listing_type = $1 and listing_id = $2)
       where id = $2', target_table
    ) using v_listing_type, v_listing_id;
  end if;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;
