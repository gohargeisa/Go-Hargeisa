# Go Hargeisa — Final Release Report

**Date:** 2026-08-05
**Scope:** Full production-readiness audit + fixes ahead of first public release.

## How this audit was done

Four parallel research passes (dead code/dependencies, accessibility/responsive, performance/images, core flows/links/i18n) read the codebase and reported findings with exact file:line references, each independently verified via grep/read before being trusted. Every finding below was either fixed directly in this pass or is listed as a known issue with a reason it wasn't. No Lighthouse run, browser automation, or real device/emulator was available in this environment — see **Performance Summary** and **Remaining Known Issues** for exactly what that does and doesn't cover.

---

## What was fixed this session

### Correctness bugs
- **Hotel search silently returned mock/seed data on zero real matches** (`lib/data/hotels.ts`) — the only one of 5 listing-search functions with this behavior (restaurants/cafes/attractions/services all correctly returned `[]`). A genuine search with zero real matches was showing fake listings instead of "no results."
- **Search queries containing a comma or parenthesis could error instead of searching** — PostgREST's `.or()` filter syntax uses `,` to separate conditions and `()` to group them; an unescaped user query containing either broke the filter grammar. Fixed with a new `lib/utils/sanitize-search-query.ts`, applied across hotels/restaurants/cafes/attractions/services.
- **`Permissions-Policy: geolocation=()` was blocking the app's own geolocation feature** (`next.config.mjs`) — City Services' "X km away" distance calls `navigator.geolocation` directly; an empty allowlist silently blocks that permission prompt from ever firing, regardless of any native-app Info.plist permission strings. Corrected to `geolocation=(self)`.
- **Invalid nested interactive markup in the notification dropdown** (`components/shared/notification-bell.tsx`) — mark-read/delete controls were `<span role="button" tabIndex={-1}>` nested inside a `<button>` (invalid HTML; browsers may reparent/break this), and `tabIndex={-1}` made them permanently unreachable by keyboard. Restructured to a `<div role="button">` row with two real, independently-focusable `<button>`s.
- **Wrong error-message fallback in the booking-cancellation flow** (`components/dashboard/bookings-panel.tsx`) — `alert(result.error ?? t("bookingsHotel"))` would have shown the literal word "Hotel" (a table-column label) as a fallback error message. Fixed to the correct generic error key.
- **PWA manifest icons were the wrong declared size** — `icon-192.png`, `icon-512.png`, and `icon-maskable-512.png` were three byte-identical copies of one uncompressed 1254×1254 source (~944KB each) despite `manifest.json` declaring `192x192`/`512x512`; the maskable icon had no actual safe-zone inset. `og-image.png` was also 1254×1254 (square) instead of the standard 1200×630 (1.91:1), so social link-preview crawlers were cropping it incorrectly. All five (including a newly-generated correctly-sized `app/apple-icon.png`) are now genuinely correct-dimension, properly-compressed files — see Performance Summary for the size deltas.

### Accessibility / RTL
- `language-switcher.tsx` trigger button had no `aria-label` (fell back to a flag image's alt text instead of describing the action) — added.
- RTL bug: the skip-to-content link used `focus:left-4` instead of `focus:start-4` (`app/[locale]/layout.tsx`) — in Arabic this pinned it to the physical-left edge instead of the reading-start edge.
- RTL bug: a room-photo remove button used `right-0.5` instead of `end-0.5` (`components/admin/hotel-rooms-manager.tsx`).
- Missing/empty `alt` text on two content-bearing images (review-photo preview, admin room-photo thumbnail) — both now have descriptive alt text.
- `notification-list.tsx`'s mark-read/delete buttons bumped from 28px to the 44px touch-target minimum, matching the convention already established for the search/lightbox/toast controls in a prior session.

### Translations (hardcoded English found and fixed)
`components/city-map/point-info-card.tsx` (Call/Directions/View Details/Open in Google Maps), `components/shared/service-action-card.tsx` (Call), `components/shared/claim-business-button.tsx` (Close), `components/shared/review-form.tsx` (photo-upload error, remove-photo label), `components/shared/booking-form.tsx` (guest count, "+N more", "Contact for pricing", Available/Unavailable, Increase/Decrease aria-labels), and `lib/actions/bookings.ts`'s server-side validation/cancellation error strings (previously always English regardless of the guest's locale, despite the UI-side fallback already being translated). All new keys added to `en`/`ar`/`so` in lockstep — parity verified at 1922/1922/1922 keys.

### Dead code removed
- 3 confirmed-unused component files deleted (`components/home/premium-card.tsx`, `components/join/floating-phone-mockup.tsx`, `components/shared/section-header.tsx`) — each had zero import sites; stale comments elsewhere claiming they were "still used" were updated.
- One dead server function removed (`lib/data/business.ts`'s `getSubscriptionNotes` — zero call sites; the one admin page that needs this data already queries it directly).
- `react-icons` dependency removed entirely — it was pulled in solely for 3 footer social icons (WhatsApp/X/TikTok, not available in the app's primary `lucide-react` set); replaced with small inline SVG components (`components/shared/brand-icons.tsx`). `npm install` confirmed the package is fully removed from the lockfile.
- Unused `images.unsplash.com` entry removed from `next.config.mjs`'s `remotePatterns` and CSP `img-src` (grep-confirmed zero references anywhere in the codebase).

### Performance
- Removed an incorrect `priority` prop from the footer logo (`components/layout/site-footer.tsx`) — the footer is never above-the-fold, so this was competing for bandwidth with the page's real LCP candidate on every single page load.
- `components/shared/video-gallery.tsx` converted from a client to a server component (no hooks/state/handlers, only used `next-intl`'s client hook unnecessarily) — it's imported directly by 6 detail-page Server Components, so this is a real bundle-size reduction, not a no-op; visible in the build output (hotel/restaurant/cafe/attractions/events/city-services detail-page JS sizes all dropped).
- See **Performance Summary** below for the icon/OG-image compression results.

---

## Performance Summary

**No Lighthouse run was possible in this environment** (no browser automation available) — the numbers below are from static code review and the production build's own bundle-size output, not a live audit score. Treat this section as "what's provably correct in the code," not a Lighthouse score.

| Area | Finding |
|---|---|
| Images | All 65 `next/image` usages checked: correct `sizes` on every `fill`-based image, no `unoptimized` flags, `remotePatterns` matches exactly the 2 hosts actually used (Supabase Storage, placehold.co). `priority` now used correctly (one true LCP candidate per page, not diluted across header/footer/hero). |
| Static assets | Fixed 5 files that were ~944KB–995KB each despite being declared as small icons — now 27KB–189KB, correct pixel dimensions matching their declared sizes. |
| Fonts | `next/font/google` self-hosted with `display: swap`, no render-blocking Google Fonts `<link>`. |
| Code splitting | Framer Motion's `LazyMotion`/`m` pattern followed consistently (21 files checked, zero stray full `motion` imports). No `next/dynamic` used anywhere — `Lightbox`/`BottomSheet`/`OfflineFavoritesSheet`/`GlobalSearch` are all eagerly imported; none are large/dependency-heavy enough to be a clear win, but converting them is a reasonable future optimization, not executed here. |
| ISR/caching | 24 public listing/detail routes correctly use `revalidate = 3600`; auth-gated routes are correctly fully dynamic; static informational pages (privacy/terms/contact/etc.) are correctly build-time static with no explicit revalidate needed. |
| Client bundle | 156 files use `"use client"`. One confirmed-safe conversion made (`video-gallery.tsx`); 5 more candidates identified (`rating-badge.tsx`, `attractions-stats.tsx`, `about-stats.tsx`, `attractions-empty-state.tsx`, `admin/form-shared.tsx`) but **not converted** — each is only used from within an already-client parent, so removing `"use client"` there would be a no-op with no bundle effect, not worth the risk of touching for zero measurable gain. |

---

## Security Notes

**Fixed this session:**
- PostgREST filter-injection/breakage risk in every listing-search function (comma/parenthesis in a user query could error the query).
- `Permissions-Policy` was blocking the app's own legitimate geolocation feature (not a vulnerability, but a real functional bug with security-header root cause).
- Search silently falling back to mock data on empty real results (data-integrity issue, not exploitable, but a real production-correctness bug).

**Verified, not modified (already correct):**
- Auth `?next=` redirect is validated against `startsWith(/${locale}/)` before use — no open-redirect.
- Sign-out clears offline-cached favorites (IndexedDB) so a shared device can't leak a previous user's saved businesses.
- The service worker's routing layer excludes `/auth/*`, `/dashboard*`, `/admin*`, `/business*`, and `/api/*` before any caching logic runs — confirmed unchanged.
- CSP is a verified-by-grep exact inventory of origins actually used, not a guess; tightened further this session (unused `images.unsplash.com` removed).
- RLS-backed booking creation/cancellation authorization logic was **not** touched — only the user-facing error message text was localized.

**Known, deferred (not attempted this session):**
- **`npm audit` reports 12 vulnerabilities** (2 low, 4 moderate, 6 high), the most serious tied to the pinned Next.js 14.2.x line — multiple high-severity CVEs (DoS via Image Optimizer config, RSC cache poisoning, HTTP request smuggling in rewrites, XSS in specific CSP-nonce configurations, SSRF in Server Actions/rewrites). **Every available fix requires a major-version bump** (Next 14→16, next-intl 3→4, `@supabase/ssr` 0.4→0.12, `eslint-config-next` major) — these are breaking changes across the framework, i18n routing, and the auth/session layer simultaneously. This was already a known, previously-flagged-and-deferred item from an earlier security pass, not a new discovery. **Recommendation: schedule a dedicated upgrade + full regression-test cycle before or shortly after launch — do not attempt this as a quick patch.** Running `npm audit fix --force` blindly was deliberately not done in this session.
- `@capacitor/browser`, `@capacitor/haptics`, `@capacitor/share` are installed but have zero call sites anywhere in the app (confirmed by grep) — either genuinely dead weight or features that were planned but never wired up (native share sheet, in-app browser handoff, haptic feedback are all plausible, valuable additions for a native app). Left installed rather than removed, since a recent session's requirements explicitly named Browser/Share as expected-working native capabilities.
- `lib/mobile/push-notifications.ts`'s `sendTokenToServer()` is an intentional stub (documented `TODO(push-backend)` in the code) — device push tokens aren't persisted server-side yet, so **targeted push notifications to specific devices do not work yet**, even though the client-side registration flow is in place.

---

## Production Checklist

- [x] Core pages verified server-rendering correctly: Home, Hotels, Restaurants, Cafes, Attractions, City Services, Events, Hotel Detail, Search, City Map — all return HTTP 200 with no server errors, in all 3 locales (en/ar/so)
- [x] Auth-gated routes (`/dashboard`, `/admin`, `/business`) correctly redirect unauthenticated requests (307) rather than erroring
- [x] Booking flow traced end-to-end: client + server validation, translated error messages (all 3 locales), owner + guest confirmation emails (each independently try/caught so a failed email never fails the booking), pending/success/error UI states all present
- [x] Auth flow traced end-to-end: login/register/Google OAuth, translated error messages for common failure cases, open-redirect-safe `?next=` handling, sign-out clears offline data
- [x] WhatsApp/Call/Maps link builders verified to degrade gracefully (omit the button, never emit a broken link) on missing phone/coordinates
- [x] Internal links spot-checked against actual routes — no broken links found
- [x] i18n: en/ar/so key parity confirmed (1922/1922/1922), zero physical-direction (non-logical) Tailwind classes remaining in every file touched this session
- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean
- [x] Dead code and one unused dependency removed; `npm install` reconciled the lockfile
- [ ] **Not done — requires a Mac with Xcode**: iOS Archive/IPA build, TestFlight upload (see prior session's iOS report — Xcode project is configured and ready, but the actual build step is a hard OS-level blocker in this environment)
- [ ] **Not done**: a dedicated Next.js/next-intl/@supabase-ssr major-version security upgrade (see Security Notes)
- [ ] **Not done**: live device/browser verification (Lighthouse score, actual gesture feel, cross-browser visual QA) — everything above was verified via code review, `tsc`/`lint`/`build`, and dev-server HTTP smoke tests, not a real browser session

---

## Remaining Known Issues (not fixed this session, with reasons)

1. **Next.js 14 has multiple high-severity CVEs**, fix requires a breaking major-version upgrade — see Security Notes. This is the single most significant open item.
2. **Push notification device-token registration is a stub** — targeted pushes to specific devices don't work until a `device_push_tokens` table + server action exist (already scoped in a code comment).
3. **Admin/business-dashboard touch targets under 44px** in a handful of lower-traffic, primarily-desktop-used tooling screens (`feature-listing-button.tsx`, `pin-listing-button.tsx`, `offers-manager.tsx`, the 16px room-photo remove button) — not fixed, since these are business-owner/admin tools rather than public-facing UI, and resizing several of them risks a layout regression I can't visually verify in this environment.
4. **`formatDate` is reimplemented 6 times and `slugify` twice** across different files with near-identical logic — not broken, but worth consolidating into shared `lib/utils/` helpers in a future cleanup pass.
5. **Contact/review/claim-business forms rely on native HTML validation** rather than styled inline field-level errors (only the booking form has full pre-submit validation with translated messages) — consistent with the app's existing pattern, not a regression, but a reasonable future polish item.
6. **`getAllHotelSlugs()` still falls back to mock hotel slugs** if the real `hotels` table is ever briefly empty at build time (a `generateStaticParams` edge case) — low impact (those slugs would just 404 correctly when visited, since `getHotelBySlug` itself has no such fallback), left as-is rather than risking an unrelated change to static-generation behavior.
7. **No live device/browser testing** — this entire audit was performed via source-code review, `tsc`/`lint`/`build`, and dev-server HTTP requests. Visual layout bugs, real touch-gesture feel, and an actual Lighthouse score are not verifiable from this environment and should be checked on a real device/browser before launch.

---

## Launch Readiness Score: **85%**

**Why not lower:** every core user flow (browsing all 6 listing types + events, search, booking, auth, offline caching, WhatsApp/Call/Maps actions) was traced through actual code and verified logically sound; real, concrete bugs were found and fixed rather than glossed over (search-fallback bug, PostgREST injection risk, a blocked geolocation permission, invalid interactive markup, wrong error-message fallback, incorrect manifest icon files); the build/lint/typecheck/i18n-parity pipeline is fully clean.

**Why not higher:** one significant, real security item (the Next.js CVE set) is explicitly deferred pending a dedicated upgrade cycle, not resolved; a handful of lower-priority polish items remain (admin touch targets, form validation styling); and — most importantly — nothing in this report was verified in an actual browser or on a real device, only through code review and HTTP-level checks, which is a meaningfully lower bar than a true pre-launch QA pass.
