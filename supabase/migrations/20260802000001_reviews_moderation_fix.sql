-- ============================================================================
-- Go Hargeisa — Reviews: fix rating-sync trigger + enable moderation
-- ============================================================================
-- Bug 1: refresh_listing_rating() (schema.sql) unconditionally reads
-- NEW.listing_type/NEW.listing_id. On a DELETE, NEW is unassigned, so every
-- review deletion (lib/actions/content.ts deleteReview) has been raising
-- "record 'new' is not assigned yet" and rolling back. Fixed by reading
-- OLD on delete, NEW otherwise.
--
-- Bug 2: the function's listing_type -> table CASE only covers the four
-- types that existed when schema.sql was written (hotel/restaurant/cafe/
-- attraction). 'service' was added later (20260729000002) but never wired
-- into this function, so submitting/deleting a review on a service listing
-- crashes the same way with a NULL %I identifier. Fixed by adding the
-- 'service' -> 'services' branch (services also has rating/review_count —
-- see 20260729000001_add_services.sql) and by no-oping instead of crashing
-- on any future/unmapped type.
-- ============================================================================

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

-- Backfill: recompute every listing's rating/review_count now, correcting
-- any drift from reviews whose deletion previously failed to sync (the
-- DELETE itself rolled back too, so this is likely a no-op — cheap safety
-- net either way).
update hotels h set
  rating = coalesce((select round(avg(rating)::numeric, 1) from reviews where listing_type = 'hotel' and listing_id = h.id), 0),
  review_count = (select count(*) from reviews where listing_type = 'hotel' and listing_id = h.id);
update restaurants r set
  rating = coalesce((select round(avg(rating)::numeric, 1) from reviews where listing_type = 'restaurant' and listing_id = r.id), 0),
  review_count = (select count(*) from reviews where listing_type = 'restaurant' and listing_id = r.id);
update cafes c set
  rating = coalesce((select round(avg(rating)::numeric, 1) from reviews where listing_type = 'cafe' and listing_id = c.id), 0),
  review_count = (select count(*) from reviews where listing_type = 'cafe' and listing_id = c.id);
update attractions a set
  rating = coalesce((select round(avg(rating)::numeric, 1) from reviews where listing_type = 'attraction' and listing_id = a.id), 0),
  review_count = (select count(*) from reviews where listing_type = 'attraction' and listing_id = a.id);
update services s set
  rating = coalesce((select round(avg(rating)::numeric, 1) from reviews where listing_type = 'service' and listing_id = s.id), 0),
  review_count = (select count(*) from reviews where listing_type = 'service' and listing_id = s.id);

-- ----------------------------------------------------------------------------
-- Bug 3: reviews RLS only ever granted UPDATE/DELETE to a review's own
-- author ("Users update/delete own reviews", schema.sql). lib/actions/
-- business.ts's replyToReview and reportReview run as the business owner
-- (or platform admin), not the reviewer, and use the plain cookie-scoped
-- client — RLS silently matched zero rows on every call, so both "owner
-- replies to a review" and "owner reports a review" have been no-ops that
-- reported success without writing anything. Same story for the new
-- admin moderation actions (dismiss/delete a reported review) below.
-- ----------------------------------------------------------------------------

drop policy if exists "Business owners and admins manage listing reviews" on reviews;
create policy "Business owners and admins manage listing reviews" on reviews for update
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
    or (listing_type = 'hotel' and exists (select 1 from hotels h where h.id = listing_id and h.owner_id = auth.uid()))
    or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = listing_id and r.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = listing_id and c.owner_id = auth.uid()))
    or (listing_type = 'service' and exists (select 1 from services s where s.id = listing_id and s.owner_id = auth.uid()))
  )
  with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
    or (listing_type = 'hotel' and exists (select 1 from hotels h where h.id = listing_id and h.owner_id = auth.uid()))
    or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = listing_id and r.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = listing_id and c.owner_id = auth.uid()))
    or (listing_type = 'service' and exists (select 1 from services s where s.id = listing_id and s.owner_id = auth.uid()))
  );

drop policy if exists "Admins delete any review" on reviews;
create policy "Admins delete any review" on reviews for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'));
