-- Go Hargeisa — opt-in text-first menu display style for restaurants/cafes.
--
-- The text-first menu (components/shared/text-first-menu-section.tsx —
-- name/price/description/add-ons, no product images) already exists and is
-- proven live on Excellence Café's bespoke page. This makes it available as
-- a genuine opt-in alternative on the GENERIC restaurant/cafe detail pages
-- too (every ordinary restaurant/cafe that isn't a fully bespoke page like
-- The Village/Al-Hikma/Excellence Café), without changing anything for any
-- existing business.
--
-- Nullable, no default: null means "current behavior, unchanged" for every
-- existing row, exactly the same as an explicit 'grid' would. Only a row
-- explicitly set to 'text_first' renders the new layout. Purely additive,
-- safe to re-run.
alter table restaurants add column if not exists menu_display_style text
  check (menu_display_style in ('grid', 'text_first'));

alter table cafes add column if not exists menu_display_style text
  check (menu_display_style in ('grid', 'text_first'));
