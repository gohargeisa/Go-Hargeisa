-- ============================================================================
-- Cafes: bring the table up to the same "premium listing" shape hotels
-- already have (description_ar/description_so, price_range, amenities),
-- plus fields cafes never had at all (social links, structured per-day
-- opening hours). Additive only — every new column is nullable or
-- defaulted, so existing cafe rows keep working unchanged.
-- Safe to re-run.
-- ============================================================================

alter table cafes add column if not exists description_ar text;
alter table cafes add column if not exists description_so text;
alter table cafes add column if not exists price_range price_range not null default '$$';
alter table cafes add column if not exists amenities text[] not null default '{}';
alter table cafes add column if not exists social_instagram text;
alter table cafes add column if not exists social_facebook text;

-- Per-day opening hours, e.g.
-- [{"days": ["saturday","sunday","monday","tuesday","wednesday"], "open": "07:00", "close": "00:00"},
--  {"days": ["thursday"], "open": "07:00", "close": "01:00"},
--  {"days": ["friday"], "open": "08:00", "close": "00:00"}]
-- The existing free-text `opening_hours` column is kept as-is for a simple
-- display fallback (and for cafes that never fill in the structured form).
alter table cafes add column if not exists opening_hours_structured jsonb not null default '[]';
