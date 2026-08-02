-- Temporary introspection helper used once to diagnose which triggers were
-- actually live on the remote database (see 20260802000003's comment for
-- the full story: 20260801000004/000005 were marked "applied" but their
-- DDL had never actually run). Dropped at the end of 20260802000003 — kept
-- here only so the local migration history matches what the remote
-- tracking table (supabase_migrations.schema_migrations) already records
-- as applied; this file is inert going forward.
create or replace function diag_list_triggers(p_tables text[]) returns table(table_name text, trigger_name text) as $$
  select event_object_table::text, trigger_name::text
  from information_schema.triggers
  where event_object_table = any(p_tables)
  order by 1, 2;
$$ language sql stable security definer set search_path = public, pg_temp;
