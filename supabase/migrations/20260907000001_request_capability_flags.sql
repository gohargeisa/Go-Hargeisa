-- ============================================================================
-- Go Hargeisa — Purchase/Event request capability flags
--
-- Same pattern as categories.supports_products/supports_appointments
-- (20260810000001, 20260810000002): a capability flag on `categories`, not
-- a hardcoded slug check anywhere in application code, so any category —
-- now or in the future — can opt into the purchase-request/event-request
-- system by flipping these two booleans. Defaults to false for every
-- existing category, so nothing changes for any current partner until the
-- next migration explicitly enables it for Emaankoo's category.
-- Purely additive, safe to re-run.
-- ============================================================================

alter table categories add column if not exists supports_purchase_requests boolean not null default false;
alter table categories add column if not exists supports_event_requests boolean not null default false;

comment on column categories.supports_purchase_requests is
  'Whether listings under this category can receive purchase (buy-for-me) requests — see purchase_requests table, lib/actions/purchase-requests.ts.';
comment on column categories.supports_event_requests is
  'Whether listings under this category can receive event-planning requests — see event_requests table, lib/actions/event-requests.ts.';
