-- ============================================================================
-- Go Hargeisa — Universal Product Ordering System, step 1: enum widening
--
-- Split into its own migration/transaction on purpose — same reason as
-- 20260818000001_widen_listing_type_enum.sql: Postgres does not allow a
-- newly-added enum value to be referenced (even as a string literal) within
-- the same transaction that added it. product_orders.status reuses the
-- shared `booking_status` enum (bookings/appointments/table_reservations all
-- already use it too); this only ADDS three new values for the fulfillment
-- workflow (preparing food/flowers, ready for pickup, out for delivery) —
-- 'pending'/'confirmed'/'cancelled'/'completed' are untouched, so no
-- existing booking/appointment/reservation/order anywhere changes behavior.
--
-- 20260823000002_universal_cart_orders.sql (next migration, run after this
-- one commits) is the one that actually builds the cart/order_items system.
-- Purely additive. Safe to re-run.
-- ============================================================================

alter type booking_status add value if not exists 'preparing';
alter type booking_status add value if not exists 'ready';
alter type booking_status add value if not exists 'out_for_delivery';
