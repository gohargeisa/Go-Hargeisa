-- ============================================================================
-- Go Hargeisa — Phase 4 Stage 3: Trial partner expiry
-- Adds a nullable trial_expires_at to the three partner-eligible tables.
-- Nullable and unset by default — no fake/assumed expiry dates are
-- backfilled onto existing trial partners; the owner sets one explicitly
-- via "Extend Trial" whenever they choose to. Only meaningful while
-- partner_status = 'trial'; ignored once a listing is 'official'.
-- Write access: the existing per-table RLS already restricts UPDATE to the
-- owner role or the listing's own business_owner (see supabase/schema.sql);
-- trial partners specifically have no dashboard access at all (partner_status
-- = 'trial' gates that in the app layer), so in practice only the owner role
-- ever sets this column — no new trigger required, unlike partner_status
-- itself which needed one because official partners DO have dashboard access
-- and could otherwise touch it.
-- Safe to re-run.
-- ============================================================================

alter table hotels add column if not exists trial_expires_at timestamptz;
alter table restaurants add column if not exists trial_expires_at timestamptz;
alter table cafes add column if not exists trial_expires_at timestamptz;
