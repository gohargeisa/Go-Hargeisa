-- ============================================================================
-- Go Hargeisa — Reviews: prevent duplicate reviews.
-- One review per user per listing. Verified zero existing duplicate rows
-- before writing this migration (empty reviews table), so this is safe to
-- add directly rather than needing a backfill/dedupe step first.
-- Safe to re-run.
-- ============================================================================

alter table reviews drop constraint if exists reviews_user_listing_unique;
alter table reviews add constraint reviews_user_listing_unique unique (user_id, listing_type, listing_id);
