-- ============================================================================
-- Go Hargeisa — promote Flormar Hargeisa to the site's existing Featured
-- Partners system.
--
-- Flormar's city_services row is already `status = 'published'` with its
-- real 225-product catalog already connected (see
-- app/[locale]/city-services/[slug]/page.tsx's FLORMAR_SLUG branch) — it has
-- been fully live and publicly browsable for a while. The one flag gating
-- it out of the homepage "Featured Partners" carousel
-- (getFeaturedPartnerShowcase in lib/data/featured-partner-showcase.ts,
-- which already filters city_services on `status = 'published' AND
-- is_partner = true`) was `is_partner = false`. This is the existing,
-- already-live "GO HARGEISA PARTNER" flag from
-- 20260815000001_add_is_partner_flag.sql — no new column, no new system.
--
-- Once this flips, Flormar's card renders automatically with its own real
-- logo/hero image (already set: logo_url, image) and the existing generic
-- "Cosmetics & Women's Beauty" category template (featuredPartnerPromo_
-- cosmetics / featuredPartnerCta_shop_now in messages/*.json) — no content
-- override needed.
--
-- Purely corrective (single UPDATE by primary key), safe to re-run.
-- ============================================================================

update city_services
set is_partner = true
where slug = 'flormar-hargeisa';

do $$
declare
  flag boolean;
begin
  select is_partner into flag from city_services where slug = 'flormar-hargeisa';
  if flag is not true then
    raise exception 'Expected flormar-hargeisa.is_partner = true after update, got %', flag;
  end if;
end $$;
