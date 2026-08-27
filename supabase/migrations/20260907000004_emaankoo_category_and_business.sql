-- ============================================================================
-- Go Hargeisa — Emaankoo Group category + business record
--
-- New City Services category ("Global Shopping & Logistics",
-- target_table='city_services', supports_purchase_requests/
-- supports_event_requests=true) plus the real Emaankoo Group listing row.
--
-- Contact info, positioning text, and address are all supplied directly by
-- the business in the onboarding brief (not invented). No founding year
-- (year_established left null — the two sources the business itself gave
-- disagree, 2021 vs 2019 — never guess between conflicting real data). No
-- lat/lng (no verified coordinates exist; a fabricated pin would be worse
-- than none — see location-map-section.tsx's own "missing location beats
-- wrong location" rule) — maps_url is instead a Google Maps *text search*
-- link built from the real address string, which LocationMapSection already
-- prefers over coordinates when both would otherwise be considered (see
-- lib/utils/google-maps.ts's resolveMapsUrl: "a business's own saved link
-- is preferred over one generated from coordinates").
--
-- No gallery/logo/hero images — none were supplied; the business's own
-- gallery/logo columns are left null/empty, same honest "no image yet"
-- state Pinnacle's storefront already uses, not a stock photo or invented
-- asset. Real images can be added later via the business dashboard's
-- existing Gallery manager with zero code changes.
--
-- status='published' + is_partner=true (partner_status already defaults to
-- 'official' — see 20260830000001): this partner's info was supplied
-- directly by the business as ready for publication, not a placeholder
-- preview like Flormar's. owner_id stays null — assigning a real owner
-- account is a separate, deliberate action the existing admin "Add
-- Partner"/ownership-transfer flow already supports, not something a
-- migration should fabricate.
-- Purely additive, safe to re-run (idempotent inserts via on conflict).
-- ============================================================================

insert into categories (
  slug, name, name_ar, name_so, icon, color, target_table, is_active, is_pinned,
  sort_order, supports_gallery, supports_new_features, schema_org_type,
  supports_products, supports_appointments, supports_purchase_requests, supports_event_requests
)
values (
  'global-shopping-logistics',
  'Global Shopping & Logistics',
  'التسوق العالمي والخدمات اللوجستية',
  'Iibsiga Caalamiga ah iyo Adeegyada Gaadiidka',
  'Globe2',
  '#2563EB',
  'city_services',
  true,
  false,
  200,
  true,
  true,
  'LocalBusiness',
  false,
  false,
  true,
  true
)
on conflict (slug) do nothing;

insert into city_services (
  slug, category, category_id, name, description,
  phone, whatsapp, email, maps_url,
  status, is_partner, service_tags
)
select
  'emaankoo-group',
  'global_shopping_logistics',
  c.id,
  'Emaankoo Group',
  'Emaankoo Group is a private e-commerce and logistics company serving individuals and businesses in Somaliland. The company helps customers purchase products from global websites and manages the process from shopping and tracking to shipping, customs support, and delivery coordination.',
  '+252633860398',
  '+252633860398',
  'emaankoogroup@gmail.com',
  'https://www.google.com/maps/search/?api=1&query=Alloore%20Mall%2C%20Star%20Area%2C%20Hargeisa%2C%20Somaliland',
  'published',
  true,
  array['e-commerce', 'logistics', 'events', 'global shopping']
from categories c
where c.slug = 'global-shopping-logistics'
  and not exists (select 1 from city_services where slug = 'emaankoo-group');
