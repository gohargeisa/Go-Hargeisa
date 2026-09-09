-- ============================================================================
-- Go Hargeisa — Excellence Café listing
--
-- A real Hargeisa restaurant/café. Seeded as `status: 'draft'` — the exact
-- same "keep it private until reviewed" mechanism already used for The
-- Village Hargeisa's own preview row (RLS makes a draft row invisible to
-- every public/anon read path: listing grids, search, sitemap, the generic
-- /restaurants/[slug] route itself). Reachable only via its own private
-- preview route (app/[locale]/preview/excellence-cafe, service-role read —
-- see lib/data/excellence-cafe-preview.ts), same pattern as
-- app/[locale]/preview/the-village. NOT linked from anywhere public. Going
-- live (routing branch in restaurants/[slug]/page.tsx + status:'published')
-- is a separate, later, explicitly-requested step — not part of this pass.
--
-- Every fact below is verified directly from the business owner's own
-- supplied information.txt and 8 official printed-menu photographs — never
-- researched or invented:
--   name, address, phone/WhatsApp, opening hours, TikTok/Instagram/Facebook.
--
-- NOT set, because no verified value exists (never guessed):
--   * lat/lng — the `restaurants` table requires both NOT NULL with no
--     default, and no real GPS coordinates were supplied. Set to Hargeisa's
--     approximate city-centre coordinates as an explicit PLACEHOLDER (same
--     situation already handled the same way for Lavender) — never
--     presented as a real geocoded pin. Replace with the real coordinates
--     once known; nothing else on the page depends on this being exact.
--   * google_maps_url — no Maps link supplied, so LocationMapSection shows
--     the verified address as text only, no embed/pin (also: no Google Maps
--     imagery is used anywhere on this page, per explicit instruction).
--   * website/email — not supplied.
--
-- cover_image / logo_url point at real assets already committed under
-- public/images/partners/excellence-cafe/ (the official logo, cropped from
-- the business's own printed-menu cover page, and a real photo from the
-- curated selection) — see scripts/build-excellence-cafe-photos.mjs.
--
-- cuisine is left at its default ('{}' — empty) rather than an inferred
-- tag list: the business owner asked to leave this blank until they
-- confirm it themselves, since nothing in information.txt or the menu
-- photos states cuisine tags explicitly.
--
-- Menu: seeded separately by scripts/seed-excellence-cafe-menu.ts (run
-- after this migration is applied) from lib/data/excellence-cafe-menu-seed.ts
-- — ~190 verified items across 14 categories, transcribed verbatim from the
-- printed menu. ordering_enabled=true so the digital menu is genuinely
-- orderable through the existing universal cart/checkout system.
--
-- products_delivery_enabled=true reflects the business's own stated delivery
-- method ("Available through regular taxi service. The restaurant does not
-- have dedicated delivery vehicles.") — there is no separate DB field for
-- that explanatory text; it is shown verbatim in the page's own Contact &
-- Services section (component-level copy, not a DB column).
--
-- owner_id stays null (assigning a real owner account is the admin
-- Add-Partner / ownership-transfer flow's job, not a migration's).
--
-- Purely additive, idempotent (on conflict do nothing), safe to re-run.
-- ============================================================================

insert into restaurants (
  slug, name, short_description, description,
  cover_image, logo_url, gallery,
  address, lat, lng,
  phone, whatsapp, social_tiktok, social_instagram, social_facebook,
  price_range, opening_hours,
  reservable, ordering_enabled, products_delivery_enabled,
  is_partner, status
)
values (
  'excellence-cafe',
  'Excellence Café',
  'Excellence Café is a restaurant and café in Hargeisa, Somaliland, open daily from 7:00 AM to 12:00 AM, offering an extensive all-day menu alongside a daily lunch buffet.',
  'Excellence Café is a restaurant and café located at Gooladda hoose Jigjiga Yar, opposite Qaalib Business Center, in Hargeisa, Somaliland. Open daily from 7:00 AM to 12:00 AM, it serves an extensive menu spanning breakfast, main courses, pizza, burgers, sandwiches, wraps, pastas, salads and desserts, alongside coffee, tea and iced coffee. The restaurant also offers an affordable daily lunch buffet. Table reservations can be made by phone or WhatsApp; delivery is available through regular taxi service, as the restaurant does not operate its own delivery vehicles. Accepted payment methods include Zaad, eDahab and Premier Cash.',
  '/images/partners/excellence-cafe/hero/mezze-spread-wide.jpg',
  '/images/partners/excellence-cafe/logo.png',
  '[]',
  'Gooladda hoose Jigjiga Yar, opposite Qaalib Business Center, Hargeisa, Somaliland',
  9.5624, -- PLACEHOLDER — Hargeisa city-centre approximate latitude, no real GPS supplied yet
  44.0770, -- PLACEHOLDER — Hargeisa city-centre approximate longitude, no real GPS supplied yet
  '+252636299996',
  '+252636299996',
  'https://www.tiktok.com/@excellencesl',
  'https://www.instagram.com/excellencecafesl',
  'https://www.facebook.com/p/Excellence-CAF%C3%89-100054214479233/',
  '$$',
  'Daily, 7:00 AM – 12:00 AM',
  true,
  true,
  true,
  true,
  'draft'
)
on conflict (slug) do nothing;
