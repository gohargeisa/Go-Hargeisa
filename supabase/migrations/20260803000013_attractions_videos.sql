-- ============================================================================
-- Go Hargeisa — Listings Upgrade Phase 5: attraction video support
--
-- hotels/restaurants/cafes/services already have a `videos jsonb` column
-- (20260801000003_media_manager_videos.sql); attractions never got one.
-- ============================================================================

alter table attractions add column if not exists videos jsonb not null default '[]';
