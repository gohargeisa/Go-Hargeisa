-- ============================================================================
-- Go Hargeisa — Al-Hikma Hijama & Wellness Centre listing
--
-- A real Hargeisa clinic: Hijama (wet/dry cupping) + massage therapy,
-- faith-inspired wellness. Goes in the EXISTING unified "Clinics" category
-- (categories.slug='clinic', target_table='city_services') as
-- clinic_type='hijama' — Hijama is already a clinic_type value
-- (20260811000005 / lib/config/clinic-attributes.ts), NOT a separate
-- category, so nothing new is created here.
--
-- Every published fact is verified from the business's own assets (official
-- TikTok @alhikmahijama_somaliland + its own posters supplied in the
-- onboarding brief):
--   name, "Hargeisa, Somaliland", phone +252 63 900 5474,
--   WhatsApp +1 613-513-9734, TikTok handle, the bio text, and the two
--   service lines (Hijama / cupping + massage therapy).
-- Independent web research found NO authoritative external source (the name
-- collides with several unrelated businesses) — so nothing beyond the above
-- is asserted.
--
-- NOT set, because no verified value exists (never guessed):
--   * address / neighbourhood / lat-lng / maps_url — LocationMapSection
--     then renders location as text only ("Hargeisa, Somaliland"), no pin,
--     no embed ("a missing location beats a wrong location").
--   * opening hours, Instagram/Facebook/website/email, year established.
--   * gallery / logo_url / image — the only supplied photos are low-res
--     social screenshots with third-party overlay UI; none usable as this
--     clinic's own documentary photography. The storefront + Partnership
--     components read the checked-in brand logo
--     (public/images/partners/al-hikma/logo.png) instead. Real photos can be
--     added later via the business dashboard Gallery manager, zero code
--     change.
--
-- owner_id stays null (assigning a real owner account is the admin
-- Add-Partner / ownership-transfer flow's job, not a migration's).
--
-- Also seeds:
--   * one `doctors` row — "Hijama Specialist Mahmoud" (user-supplied) — so
--     the existing appointment engine offers practitioner selection.
--   * the current $35 -> $25 intro offer as a `business_offers` row
--     (approved + active), using the before/after price model added in
--     20260909000001.
--
-- Purely additive, idempotent (on conflict do nothing), safe to re-run.
-- ============================================================================

insert into city_services (
  slug, category, category_id, name, description,
  phone, whatsapp, social_tiktok,
  status, is_partner, clinic_type, service_tags
)
select
  'al-hikma-hijama-wellness-centre',
  'clinic',
  c.id,
  'Al-Hikma Hijama & Wellness Centre',
  'Al-Hikma Hijama & Wellness Centre is a faith-inspired wellness clinic in Hargeisa, Somaliland, dedicated to promoting health and relaxation through Sunnah Hijama — wet and dry cupping therapy — and massage therapy. Sessions are carried out by a trained Hijama specialist with careful attention to hygiene and client comfort.',
  '+252639005474',
  '+16135139734',
  'https://www.tiktok.com/@alhikmahijama_somaliland',
  'published',
  true,
  'hijama',
  array['hijama', 'cupping therapy', 'wet cupping', 'dry cupping', 'massage therapy', 'wellness']
from categories c
where c.slug = 'clinic'
on conflict (slug) do nothing;

-- Practitioner (user-supplied name; nothing else about them is invented).
insert into doctors (city_service_id, name, specialty, specialty_ar, specialty_so, is_active, sort_order)
select
  cs.id,
  'Hijama Specialist Mahmoud',
  'Hijama Specialist',
  'أخصائي الحجامة',
  'Takhasusle Xijaamo',
  true,
  0
from city_services cs
where cs.slug = 'al-hikma-hijama-wellness-centre'
  and not exists (
    select 1 from doctors d
    where d.city_service_id = cs.id and d.name = 'Hijama Specialist Mahmoud'
  );

-- Current promotion: $35 -> $25 (SAVE $10 / 29% OFF is derived, not stored).
insert into business_offers (
  listing_type, listing_id, title, description,
  discount_type, original_price, sale_price,
  is_active, approval_status
)
select
  'city_service',
  cs.id,
  'Introductory Hijama Session',
  'A first Hijama (wet cupping) session at a reduced introductory price.',
  'fixed',
  35,
  25,
  true,
  'approved'
from city_services cs
where cs.slug = 'al-hikma-hijama-wellness-centre'
  and not exists (
    select 1 from business_offers o
    where o.listing_type = 'city_service' and o.listing_id = cs.id
      and o.title = 'Introductory Hijama Session'
  );
