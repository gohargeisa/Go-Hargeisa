-- ============================================================================
-- Go Hargeisa — Listings Upgrade Phase 3: reviews upgrade
--
-- Adds: review title, optional visit date, a soft-hide moderation `status`
-- (instant-publish stays the default — "only approved reviews are visible"
-- is implemented as "only non-hidden reviews are visible", not a pre-publish
-- queue), and per-user-once "helpful" votes with a denormalized count kept
-- in sync by a trigger (same pattern as refresh_listing_rating()).
-- ============================================================================

alter table reviews add column if not exists title text;
alter table reviews add column if not exists visit_date date;
alter table reviews add column if not exists status text not null default 'published' check (status in ('published', 'hidden'));
alter table reviews add column if not exists helpful_count integer not null default 0;

create index if not exists reviews_status_idx on reviews (status);

-- ----------------------------------------------------------------------------
-- Helpful votes — mirrors `favorites`' exact shape/RLS (schema.sql:301-308).
-- ----------------------------------------------------------------------------
create table if not exists review_helpful_votes (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references reviews(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);

create index if not exists review_helpful_votes_review_idx on review_helpful_votes (review_id);

alter table review_helpful_votes enable row level security;

drop policy if exists "Public can read helpful votes" on review_helpful_votes;
create policy "Public can read helpful votes" on review_helpful_votes for select using (true);

drop policy if exists "Users manage own helpful votes" on review_helpful_votes;
create policy "Users manage own helpful votes" on review_helpful_votes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function refresh_review_helpful_count() returns trigger as $$
declare
  v_review_id uuid;
begin
  v_review_id := coalesce(new.review_id, old.review_id);
  update reviews set helpful_count = (select count(*) from review_helpful_votes where review_id = v_review_id)
  where id = v_review_id;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists on_review_helpful_vote_change on review_helpful_votes;
create trigger on_review_helpful_vote_change
  after insert or update or delete on review_helpful_votes
  for each row execute function refresh_review_helpful_count();

-- ----------------------------------------------------------------------------
-- Narrow RPC for visitor-facing "Report this review" — lets any signed-in
-- user flip is_reported without granting general UPDATE access to other
-- people's reviews (the existing "Business owners and admins manage
-- listing reviews" UPDATE policy stays owner/admin-only for everything
-- else, e.g. owner_reply).
-- ----------------------------------------------------------------------------
create or replace function report_review(p_review_id uuid) returns void as $$
begin
  update reviews set is_reported = true where id = p_review_id;
end;
$$ language plpgsql security definer;

grant execute on function report_review(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Tighten public read access: hidden reviews are no longer selectable by
-- anonymous/other visitors (the app's own data-layer queries already filter
-- `status = 'published'` for public detail pages, this is defense in depth
-- for direct API access). The review's own author, the listing's owner, and
-- admins can still see it regardless of status — same owner/admin branches
-- as the existing UPDATE policy (20260802000001_reviews_moderation_fix.sql).
-- ----------------------------------------------------------------------------
drop policy if exists "Public can read reviews" on reviews;
create policy "Public can read reviews" on reviews for select
  using (
    status = 'published'
    or auth.uid() = user_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
    or (listing_type = 'hotel' and exists (select 1 from hotels h where h.id = listing_id and h.owner_id = auth.uid()))
    or (listing_type = 'restaurant' and exists (select 1 from restaurants r where r.id = listing_id and r.owner_id = auth.uid()))
    or (listing_type = 'cafe' and exists (select 1 from cafes c where c.id = listing_id and c.owner_id = auth.uid()))
    or (listing_type = 'service' and exists (select 1 from services s where s.id = listing_id and s.owner_id = auth.uid()))
  );
