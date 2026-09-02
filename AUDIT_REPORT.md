# Go Hargeisa — Site-wide QA audit

**Date:** 2026-09-09 · **Branch:** `partner-ecosystem-alhikma` (not merged, not deployed)

Two passes are recorded here: the targeted pass done alongside the Al-Hikma /
offers / Flormar work, and the **full site-wide QA sweep** that followed.

Environment note: the local Supabase seed is a thin subset of production
(3 published city-services: al-hikma, emaankoo, lavender; **0 hotels /
restaurants / cafes**), and the storage/studio containers fail their Docker
healthcheck on this machine. So runtime checks below cover the homepage,
category index pages, and the city-services detail + booking pages in all
three locales; hotel/restaurant/cafe **detail** pages and the
Flormar/Pinnacle/Grand-Haadi storefronts could not be loaded locally and were
audited from code only.

---

## FIXED

| # | Issue | Where | Fix |
|---|---|---|---|
| 1 | **Raw i18n key shown to users**: the "Global Shopping & Logistics" category card rendered `cityServices.categoryCardDescription_global-shopping-logistics` as its description on `/city-services` (all 3 locales). `categoryCardDescription_*` keys were also missing for `supermarket`, `dental-clinic`, `quran-memorization-center`, and the `city-services` umbrella. | `components/pages/city-services-page-client.tsx:208`, `messages/*` | Added the 5 missing keys (en/ar/so). Verified: MISSING_MESSAGE count in the dev log → 0 after the fix. |
| 2 | **Raw i18n keys on the admin Categories page**: `<h1>admin.categoriesPageTitle</h1>` + subtitle. | `app/[locale]/admin/categories/page.tsx:19-20` | Added `admin.categoriesPageTitle` / `admin.categoriesPageSubtitle` (en/ar/so). |
| 3 | **Raw i18n keys in the purchase-request detail modal**: `purchaseRequest.size` / `.color` / `.variant` rendered as labels whenever a request carried variant data. | `components/business/purchase-requests-table.tsx:149-151` | Added the 3 keys (en/ar/so). |
| 4 | **`pinnacleStorefront.loadMoreCta` missing** — raw key on Pinnacle's "load more" button. | `components/pinnacle/pinnacle-product-grid.tsx:201` | Added the key (en/ar/so). *(fixed in the earlier pass, commit a016ffc)* |
| 5 | **City-service "location" line showed the category name** (e.g. "Clinics") instead of a place, for listings with no coordinates. | `app/[locale]/city-services/[slug]/page.tsx` | Show a localized "Hargeisa, Somaliland" (`detail.locality`). Map still only renders with verified coordinates. *(a016ffc)* |
| 6 | **Al-Hikma CTA read "Book a Doctor"** and the staff section "Doctors" — a Hijama practitioner is not a doctor, and the spec says "Clinic → Book Appointment". | `app/[locale]/city-services/[slug]/page.tsx`, `.../book/page.tsx` | `isMedical` now excludes `clinic_type = 'hijama'`, so Hijama clinics use the generic "Book an Appointment" / "Staff" vocabulary. Category-driven — applies to every future Hijama clinic. Verified on the running page. |
| 7 | **Al-Hikma had no bespoke SEO / no OG image** (generic "— Hargeisa City Services" title, no image). | `app/[locale]/city-services/[slug]/page.tsx` `generateMetadata` | Added an Al-Hikma branch (same pattern as Flormar/Pinnacle): real title + description + the brand logo as the OG image + `localeAlternates` canonical/hreflang. |
| 8 | **The "Go Hargeisa × Al-Hikma" partnership lockup showed no partner logo** — Al-Hikma's listing row has no `logo_url`, and the generic page only passed `service.logoUrl`. | `app/[locale]/city-services/[slug]/page.tsx` | Fall back to `partnerTheme.partnerLogo` when the row has no logo — benefits any themed partner without a DB logo. |

---

## VERIFIED / NO ISSUE

- **Somaliland vs Somalia** — no incorrect "Somalia" attached to Hargeisa anywhere in shipped code. Structured data uses `addressCountry: "Somaliland"`. `flag-icon.tsx` / `lib/i18n/config.ts` explicitly never fall back to the Somalia flag. The one deliberate "Mogadishu, Somalia" (`lib/config/flormar-branches.ts`) is correct — Mogadishu genuinely is in Somalia, a different country, and Flormar has a branch there. The Al-Hikma page renders "Hargeisa, Somaliland" 33× and "Somalia" 0×.
- **Somaliland flag / branding** — `public/flags/somaliland.png` is the correct flag (green/white/red tricolour, Shahada, black star). Used for the `so` locale.
- **i18n parity** — en / ar / so all have the exact same 3870 keys after the fixes. All three parse as valid JSON.
- **No raw keys / MISSING_MESSAGE** on: `/`, `/{en,ar,so}`, `/en/{hotels,restaurants,cafes,city-services,shopping,supermarket,transportation,travel-guide,search,join,about,contact,city-map,attractions,events,blog,privacy,terms,diaspora-week-2026}`, and city-services detail + `/book` for al-hikma / emaankoo in all 3 locales. Dev-log MISSING_MESSAGE count: **0**.
- **Loading / error / empty states** — root `[locale]/{loading,error,not-found}.tsx` cover every route; all major listing routes also have their own `loading.tsx`, including `city-services/[slug]`.
- **Alt text** — no `<img>` on any crawled page is missing an `alt` attribute; decorative images correctly use `alt=""`. The Al-Hikma logo has `alt="Al-Hikma Hijama & Wellness Centre"`.
- **`robots` / `sitemap`** — `robots.ts` disallows `/*/admin`, `/*/dashboard`, `/*/business`, `/*/auth`, `/api/`. `sitemap.ts` iterates every published city-service slug, so Al-Hikma is included automatically. Detail pages set `localeAlternates` (canonical + hreflang).
- **`/en/rewards` → 404** — expected: loyalty is always per-partner (`/rewards/{slug}`), and no navigation links to the bare `/rewards` path.
- **Al-Hikma CTAs & contact** — hero "Book an Appointment" → `.../book`; practitioner card → `.../book?doctor=<uuid>`; WhatsApp → `wa.me/16135139734`; phone → `tel:+252639005474`. All correct; no other business's contact info on the page. (The footer's `wa.me/252656156752` is Go Hargeisa's own hardcoded fallback, shown only because site settings aren't seeded locally — pre-existing, not contamination.)
- **Existing partners not modified** — the full diff of the 3 commits touches no `LAVENDER_THEME` / `PINNACLE_THEME` / `EMAANKOO_THEME` / `GRAND_HAADI_THEME` / `MAMA_BABY_CARE_THEME` object, no other partner's storefront, no shared data. Only `AL_HIKMA_THEME` added, `FLORMAR_THEME` recoloured, and shared offer/education code extended.
- **Offer scoping** — 0 orphan `business_offers` rows; the new city-service branch of the RLS policies mirrors the existing hotel/restaurant/cafe branches exactly; the Al-Hikma offer is scoped to its own listing id.
- **No new hardcoded partner logic** — Al-Hikma uses `clinic_type = 'hijama'` (category-driven) for its education sections, not a `slug === "al-hikma"` branch. The one Al-Hikma slug constant is only for `generateMetadata`, matching the existing Flormar/Pinnacle/Emaankoo pattern.
- **`tsc` / `next lint` / `next build`** — all green.

---

## REQUIRES MY APPROVAL (not changed)

- **Hijama staff section reads "Staff"** — after fix #6 the section heading/tab for Al-Hikma's single practitioner is "Staff" (generic) rather than "Doctors". "Staff" is accurate but plain; a dedicated "Practitioner(s)" label would need a new `appointments` key threaded through `DoctorsSection` and the nav — a wider change. Left as "Staff".
- **Al-Hikma JSON-LD `@type`** — the city-services index page emits `"@type": "MedicalClinic"` for Al-Hikma (from the shared category→schema map). Defensible for a clinic; `HealthAndBeautyBusiness` might fit a wellness/cupping centre better. Not changed — it's a shared mapping affecting every clinic.
- **`site-footer.tsx` hardcoded WhatsApp fallback `252656156752`** — could not verify this is Go Hargeisa's current official number. Pre-existing; unrelated to this work.

---

## COULD NOT VERIFY

- **Al-Hikma external sources** — see the "Al-Hikma verification" section of the final report. Repeated web searches (name variants, the exact TikTok handle, the practitioner name, "wellness centre Hargeisa") returned **only unrelated businesses**; the TikTok profile page is a JS SPA and not machine-fetchable. No website, Instagram, Facebook, directory listing, address, or opening hours exist to find. Everything on the page is verified from the user-supplied Desktop assets (logo, recruitment poster, TikTok bio screenshot); nothing else is asserted.
- **Hotel / restaurant / cafe detail pages and the Flormar / Pinnacle / Grand-Haadi storefronts** — not in the local seed, so not loaded at runtime this pass. Audited from code (no changes to them in this branch). A visual check on a production-equivalent environment is still worth doing.
- **Mobile / tablet layouts, keyboard a11y, real form submissions, and the Android WebView** — not exercised this pass.

---

## Not done (would require production access or destructive change)

No production data or schema was touched. The two migrations are additive and
were applied only to local Supabase. Anything needing a destructive migration
or a large refactor was reported, not applied.
