-- ============================================================================
-- Go Hargeisa — Listings Upgrade Phase 4: Social Links + Contact fields
--
-- Adds the remaining social platforms (TikTok/Snapchat/X/YouTube/Telegram —
-- Instagram/Facebook already exist on hotels/restaurants/cafes) plus a
-- `website` column on cafes (missing entirely today). Attractions never had
-- ANY contact/social columns — this gives them the full set for the first
-- time, matching hotels/restaurants/cafes.
-- ============================================================================

alter table hotels add column if not exists social_tiktok text;
alter table hotels add column if not exists social_snapchat text;
alter table hotels add column if not exists social_x text;
alter table hotels add column if not exists social_youtube text;
alter table hotels add column if not exists social_telegram text;

alter table restaurants add column if not exists social_tiktok text;
alter table restaurants add column if not exists social_snapchat text;
alter table restaurants add column if not exists social_x text;
alter table restaurants add column if not exists social_youtube text;
alter table restaurants add column if not exists social_telegram text;

alter table cafes add column if not exists website text;
alter table cafes add column if not exists social_tiktok text;
alter table cafes add column if not exists social_snapchat text;
alter table cafes add column if not exists social_x text;
alter table cafes add column if not exists social_youtube text;
alter table cafes add column if not exists social_telegram text;

alter table attractions add column if not exists phone text;
alter table attractions add column if not exists whatsapp text;
alter table attractions add column if not exists email text;
alter table attractions add column if not exists website text;
alter table attractions add column if not exists social_instagram text;
alter table attractions add column if not exists social_facebook text;
alter table attractions add column if not exists social_tiktok text;
alter table attractions add column if not exists social_snapchat text;
alter table attractions add column if not exists social_x text;
alter table attractions add column if not exists social_youtube text;
alter table attractions add column if not exists social_telegram text;
