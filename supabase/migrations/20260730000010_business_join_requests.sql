-- ============================================================================
-- Go Hargeisa — Phase 4 Stage 6: Business Join Requests
-- A brand-new public application flow — distinct from business_claims
-- (which claims an EXISTING listing). This proposes a business that isn't
-- listed yet, so it carries the full set of fields needed to eventually
-- create a real hotels/restaurants/cafes row (name, contact, address,
-- description, images, category-specific extras), reusing the existing
-- listing_type_business enum ('hotel'|'restaurant'|'cafe') since the
-- supported categories are identical.
--
-- Anyone can INSERT (public form, no auth) — same anon-write shape already
-- proven safe for business_claims/contact_messages. Only the owner role can
-- read/manage requests. Internal notes get their own owner-only table
-- (business_join_request_notes), same reasoning as business_subscription_
-- notes: a shared table with RLS can't do column-level privacy, and these
-- notes must never be visible to the person who submitted the request.
--
-- Duplicate prevention is intentionally NOT a DB constraint: a business
-- that was rejected or archived should be able to reapply, which a hard
-- unique index would block. The app layer (lib/actions/business-requests.ts)
-- checks for an existing pending/needs_info request with the same email +
-- business name before inserting.
--
-- Notification trigger mirrors notify_owners_new_business_claim exactly
-- (see 20260730000004_owner_notifications.sql) — SECURITY DEFINER so the
-- anonymous submitter (who has no INSERT grant on notifications) can still
-- trigger one for every owner.
-- Safe to re-run.
-- ============================================================================

do $$ begin
  create type business_request_status as enum ('pending', 'approved', 'rejected', 'needs_info', 'archived');
exception when duplicate_object then null;
end $$;

create table if not exists business_join_requests (
  id uuid primary key default gen_random_uuid(),
  category listing_type_business not null,
  business_name text not null,
  owner_name text not null,
  phone text not null,
  whatsapp text,
  email text not null,
  address text not null,
  maps_url text,
  description text not null,
  logo text,
  gallery jsonb not null default '[]'::jsonb,
  menu_pdf_url text,
  booking_url text,
  website text,
  status business_request_status not null default 'pending',
  converted_listing_type listing_type_business,
  converted_listing_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_business_join_requests_status
  on business_join_requests (status, created_at desc);
create index if not exists idx_business_join_requests_email
  on business_join_requests (lower(email));

alter table business_join_requests enable row level security;

drop policy if exists "Anyone can submit a join request" on business_join_requests;
create policy "Anyone can submit a join request" on business_join_requests
  for insert
  with check (true);

drop policy if exists "Owners manage join requests" on business_join_requests;
create policy "Owners manage join requests" on business_join_requests
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

create table if not exists business_join_request_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references business_join_requests(id) on delete cascade,
  note text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_business_join_request_notes_request
  on business_join_request_notes (request_id, created_at desc);

alter table business_join_request_notes enable row level security;

drop policy if exists "Owner manages join request notes" on business_join_request_notes;
create policy "Owner manages join request notes" on business_join_request_notes
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

create or replace function notify_owners_new_join_request() returns trigger as $$
begin
  insert into notifications (user_id, title, message, type, action_url)
  select id, 'New business join request', new.business_name || ' wants to join Go Hargeisa', 'info', '/admin/requests'
  from profiles where role = 'owner';
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_new_join_request on business_join_requests;
create trigger trg_notify_new_join_request
  after insert on business_join_requests
  for each row execute procedure notify_owners_new_join_request();
