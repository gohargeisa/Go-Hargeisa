-- ============================================================================
-- Go Hargeisa — Phase 2: Essential City Services
-- The `listing_type` enum (reviews / favorites / saved_trip_items) is
-- separate from `listing_type_business` (business_claims / metric events /
-- subscriptions / messages, already extended in
-- 20260729000001_add_services.sql). Both need 'service' so reviews,
-- favorites, and "Add to Trip" work for the new categories exactly like
-- they do for hotels/restaurants/cafes.
-- ============================================================================

alter type listing_type add value if not exists 'service';
