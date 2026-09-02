# Go Hargeisa — audit notes (partner-ecosystem / Al-Hikma work)

**Date:** 2026-09-09 · **Branch:** `partner-ecosystem-alhikma`

This documents the audit performed alongside the Al-Hikma / offers / Flormar work.
It is **not** a full site-wide manual QA. Scope and honesty notes are at the bottom.

---

## Verified in this session

| Area | Method | Result |
|---|---|---|
| Offers → city_service RLS | local Supabase: anon read of a published city_service offer | ✅ visible; unpublished/​unapproved not visible |
| Offer price CHECK constraint | local Supabase: insert with sale ≥ original | ✅ rejected (`business_offers_price_sane`) |
| Al-Hikma page render | local Supabase, `curl` en / ar / so | ✅ HTTP 200 all three |
| Before/after pricing math | rendered `$35 → $25` | ✅ "Save $10", "29% off" |
| Practitioner in booking | rendered | ✅ "Hijama Specialist Mahmoud" |
| Hijama education + Sunnah + Women's-coming-soon | rendered en/ar/so | ✅ present, no raw keys |
| Partner theme (green) + RTL | rendered `--pt-primary` + `dir="rtl"` (ar) | ✅ applied |
| i18n key parity | `en/ar/so` key counts | ✅ equal (3859) |
| MISSING_MESSAGE on loaded pages | dev-server log for `/`, Al-Hikma ×3 | ✅ none |
| `tsc --noEmit`, `eslint`, `next build` | each phase | ✅ green |

---

## Issues found and FIXED

1. **`pinnacleStorefront.loadMoreCta` — missing translation key.**
   `components/pinnacle/pinnacle-product-grid.tsx:201` calls `t("loadMoreCta")`
   but the key did not exist in `en/ar/so`. Pinnacle has a large catalog so the
   "load more" button renders → visitors saw `pinnacleStorefront.loadMoreCta`.
   **Fix:** added the key to all three locale files ("Load more" / "عرض المزيد" /
   "Muuji wax dheeraad ah").

2. **City-service location line showed the category name as the "address".**
   `city-services/[slug]/page.tsx` passed `address={categoryLabel}` to
   `LocationMapSection`, so a listing with no coordinates rendered a map-pin row
   reading e.g. "Clinics". `city_services` has no address column, and every
   listing on this platform is in Hargeisa.
   **Fix:** pass a localized "Hargeisa, Somaliland" (`detail.locality`) instead.
   The embedded map still only appears with verified coordinates (the
   Hargeisa-centre fallback pair is already filtered inside `LocationMapSection`).

---

## Observations / deferred (reported, not changed)

- **Al-Hikma has no verified coordinates or street address.** `lat/lng`
  defaulted to the Hargeisa-centre fallback (`9.5624, 44.065`), which
  `LocationMapSection`'s `isGenericFallbackCoords` guard already treats as "no
  pin". Correct behaviour ("a missing location beats a wrong location"); the
  location section now shows "Hargeisa, Somaliland" as text only. If the clinic
  supplies a real map link or GPS, add it via the admin/business dashboard — no
  code change needed.
- **Flormar storefront + loyalty card were not visually re-verified** — the
  Flormar `city_services` row is seeded by a migration not present in the local
  dev database, so the storefront could not be loaded locally this session. The
  change is a colour-token swap in the established `PartnerThemeScope` system
  (identical mechanism to Lavender / Mama Baby Care / Pinnacle, which do render
  correctly), and `loyalty-card.tsx` is already partner-agnostic (brand colour
  from the scope, verified by reading the component). Worth a visual check on a
  full environment before release.
- **Local Supabase migration history has drifted from production.** Several
  `20260907*`/`20260908*` migrations depend on data inserted by out-of-band
  scripts (e.g. `scripts/add-lavender-menu-items.ts`) and carry migration-time
  `raise exception` self-checks, so a clean `supabase db reset` to HEAD fails
  locally (it does **not** affect production, where the data exists). For this
  session those data-only migrations were held back locally to get a working DB;
  the committed migration files are untouched. Fixing the local seed so the dev
  environment can reach HEAD is a separate task.
- **Arabic & Somali strings added in this work are Claude drafts** (offers UI,
  the whole `hijamaEducation` namespace, Al-Hikma practitioner specialty). They
  are grammatical and use correct terminology but should get a native-speaker
  review pass, especially the religious phrasing in `hijamaEducation.sunnah`.

---

## NOT done this session (out of scope for a safe pass / needs a full environment)

A genuine site-wide audit — every page, every locale, mobile + tablet + desktop,
every interactive control, search, forms, SEO/meta, a11y, performance — was **not**
performed. What is above is a targeted pass around the code touched by this work
plus a few known problem areas. A full QA sweep on a production-equivalent
environment is still worth doing and is the right place to catch:
dead buttons, broken deep links, contrast/readability across themed pages,
RTL regressions, empty-state polish, image correctness, and partner data
isolation beyond the two partners touched here.

Nothing requiring a destructive migration or a large refactor was changed.
