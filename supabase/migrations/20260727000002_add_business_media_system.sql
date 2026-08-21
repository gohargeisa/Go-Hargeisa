-- ============================================================================
-- Go Hargeisa — Business Media Management System
-- Extends the logo / categorized-gallery / menu system already shipped for
-- hotels to restaurants and cafes. Run in the Supabase SQL editor after
-- schema.sql, add_infrastructure.sql, and add_hotel_details_upgrade.sql.
-- Every statement is guarded with IF NOT EXISTS so it's safe to re-run.
-- ============================================================================

alter table restaurants
  add column if not exists logo_url text,
  add column if not exists menu_pdf_url text;

alter table cafes
  add column if not exists logo_url text,
  add column if not exists menu jsonb not null default '[]',
  add column if not exists menu_pdf_url text;
