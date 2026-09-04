-- ============================================================================
-- Backfill missing `profiles` rows for orphaned `auth.users`.
--
-- Root cause of "Something went wrong" on Membership Join Now for
-- gohargeisa@gmail.com (and 2 other accounts, all created 2026-07-21/22,
-- before `handle_new_user()`/`on_auth_user_created` — see
-- 20260720000001_schema.sql — was reliably wired up): `loyalty_members.user_id`
-- has `references profiles(id)` (not `auth.users(id)`), so `loyalty_join()`'s
-- `insert into loyalty_members (...)` raises an unhandled foreign-key
-- violation for any signed-in user with no `profiles` row. That raw Postgres
-- error message doesn't match any case in lib/loyalty/errors.ts's
-- localiseLoyaltyRpcError(), so it falls through to the generic
-- "Something went wrong. Please try again." — the join itself never
-- actually runs.
--
-- This is a pure data backfill (no DDL, no destructive change): every
-- `auth.users` row missing its `profiles` row gets one created with the same
-- shape `handle_new_user()` already inserts for every other user (id +
-- full_name from raw_user_meta_data, role defaults to 'user' — this does NOT
-- grant owner/admin access; that's a separate, deliberate decision for
-- whoever administers this project). Idempotent via `on conflict do nothing`
-- — safe to re-run, and self-heals any future account that somehow slips
-- through the trigger again.
-- ============================================================================

insert into public.profiles (id, full_name)
select u.id, u.raw_user_meta_data->>'full_name'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
