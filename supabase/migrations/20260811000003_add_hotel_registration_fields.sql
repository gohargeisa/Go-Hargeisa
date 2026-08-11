-- ============================================================================
-- Go Hargeisa — Phase 3: Hotel-specific registration fields
--
-- Adds hotel attributes genuinely new to the schema (hotel_type, star_rating
-- — a self-declared classification, deliberately distinct from
-- `hotels.rating`, the guest-review-derived score — plus number_of_floors,
-- year_established) to the real `hotels` table, and mirrors them plus 6 more
-- intake-time fields onto `business_join_requests` so the /join form can
-- capture this information at registration time and carry it through to the
-- real listing on conversion (lib/actions/business-requests.ts).
--
-- hotel_type vocabulary (corrected per explicit review): hotel, boutique,
-- resort, guesthouse, hostel, apartment_hotel — labels in
-- lib/config/hotel-attributes.ts.
--
-- check_in_time/check_out_time/booking_whatsapp/booking_com_url/languages
-- already exist on `hotels` (from earlier work) — only business_join_requests
-- needs them added here, so the intake form has somewhere to stage them
-- before a real hotel row exists. `languages` on business_join_requests
-- reuses the exact same stored values ("English"/"Somali"/"Arabic") as the
-- existing admin hotel form's free-text tag input, for consistency — see
-- LANGUAGE_SPOKEN_OPTIONS in lib/config/hotel-attributes.ts.
--
-- estimated_room_count/room_types_offered are intake-only (business_join_
-- requests), NOT added to `hotels` — the real, structured per-room-type data
-- continues to live in `hotel_rooms` (managed via HotelRoomsManager after
-- approval); these two are just an admin-review hint of what the owner
-- intends to offer, not synced onto the real listing.
--
-- hotel_type uses the same fixed-vocabulary CHECK-constraint pattern as
-- products.category (see 20260810000001_products_engine.sql) rather than a
-- native Postgres enum.
--
-- Accepted payment methods and the "Meeting Rooms"/"Room Service" amenities
-- reuse the existing free-text `amenities` column (already on both tables)
-- via the intake amenities checklist (lib/utils/partner-categories.ts) —
-- no schema change needed for those.
--
-- No existing row's data is touched (all new columns, no updates/deletes).
-- No business/listing record is modified or removed.
-- Safe to re-run (if-not-exists column adds throughout).
-- ============================================================================

alter table hotels add column if not exists hotel_type text
  check (hotel_type in ('hotel', 'boutique', 'resort', 'guesthouse', 'hostel', 'apartment_hotel'));
alter table hotels add column if not exists star_rating integer
  check (star_rating between 1 and 5);
alter table hotels add column if not exists number_of_floors integer;
alter table hotels add column if not exists year_established integer;

alter table business_join_requests add column if not exists booking_whatsapp text;
alter table business_join_requests add column if not exists booking_com_url text;
alter table business_join_requests add column if not exists check_in_time text;
alter table business_join_requests add column if not exists check_out_time text;
alter table business_join_requests add column if not exists hotel_type text
  check (hotel_type in ('hotel', 'boutique', 'resort', 'guesthouse', 'hostel', 'apartment_hotel'));
alter table business_join_requests add column if not exists star_rating integer
  check (star_rating between 1 and 5);
alter table business_join_requests add column if not exists estimated_room_count integer;
alter table business_join_requests add column if not exists room_types_offered text[] not null default '{}';
alter table business_join_requests add column if not exists number_of_floors integer;
alter table business_join_requests add column if not exists year_established integer;
alter table business_join_requests add column if not exists languages text[] not null default '{}';
