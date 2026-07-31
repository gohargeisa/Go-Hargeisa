-- ============================================================================
-- Go Hargeisa — Media Manager: optional short videos
-- Adds a `videos` jsonb column (array of {url, caption?}) to hotels/
-- restaurants/cafes — the one genuinely new media type; cover image, logo,
-- and photo gallery already existed and already had drag & drop, multi-file
-- upload, reordering, and client-side compression (lib/utils/compress-image.ts).
-- Reuses the existing public `listing-images` storage bucket — no new bucket
-- or RLS needed, since the bucket already has no MIME-type restriction.
-- Safe to re-run.
-- ============================================================================

alter table hotels add column if not exists videos jsonb not null default '[]';
alter table restaurants add column if not exists videos jsonb not null default '[]';
alter table cafes add column if not exists videos jsonb not null default '[]';
