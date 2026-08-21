-- ============================================================================
-- Go Hargeisa — Base table/routine/sequence grants for anon/authenticated
--
-- Supabase's hosted platform applies this standard grant set automatically
-- when a project is created (outside of migration history), which is why it
-- was never captured in a migration file — production has always had it.
-- The local CLI's Postgres image does not apply it, so a fresh `supabase
-- start` replay leaves every table's RLS policies unreachable (Postgres
-- requires a base GRANT before RLS is even evaluated). Discovered while
-- setting up local dev: every query from the anon key failed with
-- "permission denied for table X" despite correct, matching RLS policies.
--
-- Pure grants, no DDL on app tables. Safe to re-run; harmless if ever
-- applied to production (grants there already match this).
-- ============================================================================

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant all on all routines in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;

grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant execute on all routines in schema public to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;

alter default privileges for role postgres in schema public grant all on tables to postgres, service_role;
alter default privileges for role postgres in schema public grant all on routines to postgres, service_role;
alter default privileges for role postgres in schema public grant all on sequences to postgres, service_role;

alter default privileges for role postgres in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges for role postgres in schema public grant execute on routines to anon, authenticated;
alter default privileges for role postgres in schema public grant usage on sequences to anon, authenticated;
