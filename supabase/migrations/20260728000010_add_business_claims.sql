-- ============================================================================
-- Go Hargeisa — Business Claims
-- Lets anyone submit a "this is my business" request for an unclaimed
-- hotel/restaurant/cafe listing. Follows the same ownership RLS pattern as
-- business_metric_events (supabase/migrations/add_business_dashboard.sql):
-- public can insert, only the platform owner can read/manage the queue.
-- Reuses the existing listing_type_business enum. Safe to re-run.
-- ============================================================================

create table if not exists business_claims (
  id uuid primary key default gen_random_uuid(),
  listing_type listing_type_business not null,
  listing_id uuid not null,
  full_name text not null,
  email text not null,
  phone text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_business_claims_listing
  on business_claims (listing_type, listing_id);

create index if not exists idx_business_claims_status
  on business_claims (status, created_at);

alter table business_claims enable row level security;

drop policy if exists "Anyone can submit a business claim" on business_claims;
create policy "Anyone can submit a business claim" on business_claims
  for insert with check (true);

drop policy if exists "Owners manage business claims" on business_claims;
create policy "Owners manage business claims" on business_claims
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));
