-- ============================================================================
-- Go Hargeisa — Excellence Café goes live
--
-- The follow-up step that 20260911000001's sibling migration
-- (20260910000001_excellence_cafe_listing.sql) explicitly deferred:
--
--   "Going live (routing branch in restaurants/[slug]/page.tsx +
--    status:'published') is a separate, later, explicitly-requested step
--    — not part of this pass."
--
-- That step has now been explicitly requested. This migration:
--
--   1. Flips the Excellence Café `restaurants` row from 'draft' to
--      'published'. The public RLS policy ("Public can read published
--      restaurants" — USING (status = 'published' AND is_suspended = false))
--      is what was hiding the row from every anon read path: the
--      /restaurants grid, search, the sitemap, and the /restaurants/[slug]
--      route itself (getRestaurantBySlug relies on that policy, it has no
--      explicit status filter of its own). Nothing else gates it —
--      RESTAURANTS_PUBLIC_ENABLED is already true and there is no
--      restaurant "presentation mode" (that is hotels-only). The row
--      already has is_suspended = false and a real cover/logo, so it
--      renders through the generic production restaurant page immediately.
--
--   2. Sets menu_display_style = 'text_first'. Every one of Excellence
--      Café's ~190 seeded menu items is name / price / description only
--      (the source is 8 printed-menu photographs — no per-dish
--      photography), so the editorial, category-navigated TextFirstMenuSection
--      reads far better than a ~190-card image grid. The restaurants/[slug]
--      page now honors this column for any restaurant, the same way the
--      cafes/[slug] page already did for any cafe.
--
-- owner_id is deliberately left NULL — assigning a real owner account is
-- the admin Add-Partner / ownership-transfer flow's job, exactly as noted
-- in 20260910000001. Publishing a listing does not require an owner (The
-- Village Hargeisa is published with owner_id NULL today).
--
-- No product rows, no booking/reservation/cart/notification config, and no
-- other business's data is touched. Idempotent, safe to re-run.
-- ============================================================================

update restaurants
set status = 'published',
    menu_display_style = 'text_first'
where slug = 'excellence-cafe'
  and status = 'draft';
