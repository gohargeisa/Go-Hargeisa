-- ============================================================================
-- Go Hargeisa — Hotel Booking Mode
-- Every hotel can choose between two booking modes:
--   1. Go Hargeisa Booking — guests submit a request directly on the site,
--      which lands in the hotel owner's Bookings dashboard (reuses the
--      existing `bookings` table from add_business_dashboard.sql, just adds
--      a public/anon INSERT policy so guests — not just owners — can create
--      a 'pending' row).
--   2. External Booking — guests are redirected to one of: the hotel's
--      official website, Booking.com, WhatsApp, or a custom booking URL,
--      chosen by `external_booking_option`.
-- Column-driven (no hardcoded per-hotel logic) so this scales to hundreds of
-- hotels without any app-code branching per listing. Safe to re-run.
-- ============================================================================

do $$ begin
  create type hotel_booking_mode as enum ('go_hargeisa', 'external');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type hotel_external_booking_option as enum ('website', 'booking_com', 'whatsapp', 'custom_url');
exception when duplicate_object then null;
end $$;

alter table hotels
  add column if not exists booking_mode hotel_booking_mode not null default 'go_hargeisa',
  add column if not exists external_booking_option hotel_external_booking_option,
  add column if not exists external_booking_url text,
  add column if not exists booking_whatsapp text,
  add column if not exists booking_com_url text;

-- ----------------------------------------------------------------------------
-- Guests can now submit a booking REQUEST themselves (previously `bookings`
-- rows were only ever entered manually by the business owner — see
-- add_business_dashboard.sql). Restricted to inserting 'pending' rows only;
-- guests still can't read, confirm, or cancel bookings — that stays owner-only
-- via the existing "Owners manage..." policies below.
-- ----------------------------------------------------------------------------
drop policy if exists "Anyone can submit a booking request" on bookings;
create policy "Anyone can submit a booking request" on bookings
  for insert
  with check (status = 'pending');
