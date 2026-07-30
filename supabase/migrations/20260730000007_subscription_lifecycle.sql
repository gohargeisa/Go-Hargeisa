-- ============================================================================
-- Go Hargeisa — Phase 4 Stage 2: Owner subscription management
-- Adds a lifecycle status to business_subscriptions (activate/pause/cancel)
-- and a separate, owner-only notes table (internal notes must never be
-- readable by the business owner they're about — a single shared table with
-- row-level security can't do column-level privacy, so this uses a
-- dedicated table locked to role='owner' instead, the same approach already
-- used for activity_logs).
--
-- `status` write access needs no new trigger: business_subscriptions already
-- only grants business owners SELECT + one-time INSERT (see
-- 20260730000001_subscription_tiers.sql) — only the owner role can UPDATE an
-- existing row, so status changes are already owner-only by construction.
-- `status` itself IS visible to the business owner (read-only) — knowing
-- whether your own subscription is active/paused/cancelled isn't sensitive,
-- unlike the internal notes about you.
-- Safe to re-run.
-- ============================================================================

do $$ begin
  create type subscription_status as enum ('active', 'paused', 'cancelled');
exception when duplicate_object then null;
end $$;

alter table business_subscriptions add column if not exists status subscription_status not null default 'active';

create table if not exists business_subscription_notes (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references business_subscriptions(id) on delete cascade,
  note text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_business_subscription_notes_subscription
  on business_subscription_notes (subscription_id, created_at desc);

alter table business_subscription_notes enable row level security;

drop policy if exists "Owner manages subscription notes" on business_subscription_notes;
create policy "Owner manages subscription notes" on business_subscription_notes
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));
