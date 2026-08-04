-- ============================================================================
-- Go Hargeisa — Listings Upgrade Phase 1: unified Amenities vocabulary
--
-- Adds `amenities_v2 text[]` (the new ~38-code fixed vocabulary from
-- lib/config/amenities.ts) to every listing table in this initiative's
-- scope. This is a NEW, additional column — it does not replace or drop:
--   - hotels.amenities / cafes.amenities (free-text / cafe-specific enum) —
--     these still power card-preview chips (hotel-card.tsx,
--     premium-hotel-card.tsx) and the hotel search filter
--     (lib/utils/filter-listings.ts getUniqueAmenities), which are a
--     separate, free-text-driven concern left untouched by this migration.
-- Only the detail-page "Amenities" section switches to reading
-- amenities_v2 (see components/shared/amenities-section.tsx).
--
-- Backfill is intentionally best-effort and partial:
--   - hotels: regex-matches existing free-text amenities against the new
--     vocabulary's obvious synonyms. Low risk — HOTELS_PRESENTATION_MODE
--     restricts the public site to a single hotel row today.
--   - cafes: only cafes' true amenity-like codes (wifi, indoor_seating,
--     outdoor_seating, card_payments, takeaway) have a home in the new
--     vocabulary. Cafes' food/drink-descriptor codes (specialty_coffee,
--     tea, cold_drinks, desserts, light_meals, work_friendly) are NOT
--     amenities per the new vocabulary and are deliberately not migrated —
--     they stay in the untouched legacy `amenities` column, unused by any
--     UI going forward (not dropped, in case that data is wanted later for
--     a "menu highlights"-style feature instead).
-- ============================================================================

alter table hotels add column if not exists amenities_v2 text[] not null default '{}';
alter table restaurants add column if not exists amenities_v2 text[] not null default '{}';
alter table cafes add column if not exists amenities_v2 text[] not null default '{}';
alter table attractions add column if not exists amenities_v2 text[] not null default '{}';
alter table events add column if not exists amenities_v2 text[] not null default '{}';
alter table city_services add column if not exists amenities_v2 text[] not null default '{}';

-- Hotels: best-effort free-text -> code regex backfill.
update hotels set amenities_v2 = (
  select array_remove(array_agg(distinct code), null) from (
    select case
      when a ~* 'wi[\s-]?fi' then 'wifi'
      when a ~* '\bpark' then 'parking'
      when a ~* 'air ?condition|\bac\b' then 'air_conditioning'
      when a ~* 'restaurant|dining' then 'restaurant'
      when a ~* 'breakfast' then 'breakfast'
      when a ~* 'gym|fitness' then 'gym'
      when a ~* 'pool' then 'swimming_pool'
      when a ~* 'spa' then 'spa'
      when a ~* 'conference|meeting' then 'meeting_rooms'
      when a ~* 'wheelchair|accessib' then 'wheelchair_accessible'
      when a ~* 'card|credit' then 'card_payment'
      when a ~* 'security|guard' then 'security'
      when a ~* 'cctv|camera' then 'cctv'
      else null
    end as code
    from unnest(amenities) as a
  ) mapped
)
where amenities is not null and array_length(amenities, 1) > 0;

-- Cafes: direct 1:1 rename of the true amenity-like subset, plus the
-- standalone `wifi` boolean column (some rows set that flag instead of, or
-- in addition to, listing "wifi" in the amenities array).
update cafes set amenities_v2 = (
  select array_remove(array_agg(distinct code), null) from (
    select case a
      when 'wifi' then 'wifi'
      when 'indoor_seating' then 'indoor_seating'
      when 'outdoor_seating' then 'outdoor_seating'
      when 'card_payments' then 'card_payment'
      when 'takeaway' then 'takeaway'
      else null
    end as code
    from unnest(coalesce(amenities, '{}'))  as a
    union all
    select 'wifi' where wifi
  ) mapped
);
