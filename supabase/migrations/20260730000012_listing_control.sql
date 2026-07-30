-- ============================================================================
-- Go Hargeisa — Phase 4 Stage 8: Listing control (Publish/Hide/Archive/
-- Draft/Feature/Pin/Delete)
-- Publish/Hide/Archive/Draft all already exist as the three-value
-- content_status enum ('draft'|'published'|'archived') — the only gap was
-- that the admin UI's quick-toggle only ever switched between 'published'
-- and 'archived', never surfacing 'draft' as a reachable state. Feature
-- already existed as a column but only editable through the full edit
-- form, not as a one-click list action. Delete already exists.
--
-- Pin is the one genuinely new concept: adds is_pinned to every table that
-- already carries `featured` (hotels/restaurants/cafes/attractions/
-- services, all built on the same base listing shape) so pinned items can
-- sort to the top of their public listing page, ahead of merely featured
-- ones. Defaults to false so no existing listing jumps to the top of any
-- page as a side effect of this migration.
-- Safe to re-run.
-- ============================================================================

alter table hotels add column if not exists is_pinned boolean not null default false;
alter table restaurants add column if not exists is_pinned boolean not null default false;
alter table cafes add column if not exists is_pinned boolean not null default false;
alter table attractions add column if not exists is_pinned boolean not null default false;
alter table services add column if not exists is_pinned boolean not null default false;

create index if not exists idx_hotels_pinned_featured on hotels (is_pinned desc, featured desc);
create index if not exists idx_restaurants_pinned_featured on restaurants (is_pinned desc, featured desc);
create index if not exists idx_cafes_pinned_featured on cafes (is_pinned desc, featured desc);
create index if not exists idx_attractions_pinned_featured on attractions (is_pinned desc, featured desc);
