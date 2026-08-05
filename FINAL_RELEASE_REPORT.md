# Go Hargeisa — Final Release Report

**Date:** 2026-08-05 (Pass 1), 2026-08-05 (Pass 2 — senior QA pass)
**Scope:** Full production-readiness audit + fixes ahead of first public release, across two passes.

## How this audit was done

**Pass 1** — four parallel research passes (dead code/dependencies, accessibility/responsive, performance/images, core flows/links/i18n).
**Pass 2** — a second, senior-QA-engineer-framed audit covering the ground Pass 1 didn't: memory leaks, console-error sources, loading/empty/error-state coverage, PWA/native Android+iOS compatibility, and a deeper SEO/broken-link/responsive pass.

Both passes used the same method: parallel research agents reported findings with exact file:line references, each independently re-verified (via grep/read, and for Pass 2's TypeScript changes, via `tsc`) before being trusted or acted on. Every finding was either fixed directly or is listed in **Remaining Known Issues** with the reason it wasn't. No Lighthouse run, browser automation, or real device/emulator was available in this environment in either pass — see **Performance Summary** and **Remaining Known Issues**.

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

## Pass 2 — Senior QA Audit: what was fixed

### Offline behavior / unhandled promise rejections
The offline-caching feature (service worker + IndexedDB, built in an earlier session) works correctly, but several **interactive** components called Server Actions with no `.catch()` — offline, the action's network call rejects on its own regardless of any try/catch inside the action's server-side body, so these threw unhandled rejections:
- `components/shared/global-search.tsx` — opening search offline threw; additionally, a failed in-flight search left the loading spinner running forever instead of falling back to "no results." Both fixed.
- `components/shared/notification-bell.tsx` — mounted **twice** per page (desktop + mobile header), so this doubled the unhandled-rejection count for any signed-in visitor loading a page offline. Fixed.
- `components/shared/offline-favorites-sheet.tsx` — added the same unmount-guard pattern used elsewhere for consistency (its IndexedDB reads don't actually reject, but the guard was missing).
- `lib/hooks/use-live-notifications.ts` — `markOneRead`/`markAllRead`/`deleteOne` had no try/catch around their Server Action calls; offline, this both logged an unhandled rejection **and** skipped the optimistic-UI rollback (a mark-read/delete would appear to succeed in the UI while never having happened server-side). `loadMore` had the same gap, which would have left its spinner stuck on failure. All four now roll back correctly and never throw uncaught.

### Booking flow
- `submitBookingRequest` (`lib/actions/bookings.ts`) had no top-level try/catch — only the two best-effort email-sending blocks were guarded. A genuine unexpected failure (Supabase outage, network blip) would have surfaced as an unhandled rejection instead of the form's polished inline error state. Now wrapped, returning the existing translated generic error message on any unexpected throw.

### Memory leaks
- `components/shared/hotel-gallery-slider.tsx` — the carousel's `pointerDown` listener was registered but never removed on cleanup (only `select` was); every time the effect re-ran, a new listener stacked on top of the old one. Fixed.
- `lib/mobile/push-notifications.ts` — `requestAndRegisterPushNotifications()`'s two native listeners (`registration`/`registrationError`) were never removed; retrying (e.g. re-tapping "Enable notifications" after a failure) permanently stacked more native listeners on every attempt. Now removed as soon as either fires.

### Hydration mismatch
- `components/shared/notification-list.tsx` rendered a relative-time string (`"2 minutes ago"`) unconditionally on mount, computed independently on the server-render and client-hydration passes — a notification whose age straddled a label boundary between the two (e.g. "59s ago" → "1m ago") would produce a hydration-mismatch console error. Fixed with the same mount-guard pattern already used by `open-status-badge.tsx`.

### Loading states
Four missing `loading.tsx` files added, matching the existing skeleton-component pattern exactly: `app/[locale]/events/loading.tsx`, `app/[locale]/events/[slug]/loading.tsx`, `app/[locale]/city-services/[slug]/loading.tsx`, `app/[locale]/city-map/loading.tsx`.

### SEO
- **Sitemap gap**: `app/sitemap.ts` never listed `/services/[category]/[slug]` detail pages or `/explore/[slug]` destination pages — `getAllServiceSlugs()` existed but was never imported into the sitemap; destinations had no dedicated slug-fetcher so the sitemap only listed the static `/explore` list route. Both now included (service entries respect the existing `SERVICES_PUBLIC_ENABLED` flag, same as every other listing type).
- **robots.txt gap**: `/*/business` was missing from the disallow list (admin/dashboard/auth were all correctly blocked, business wasn't) — inconsistent given `business/layout.tsx` already sets `noindex` at the meta level, but wasted crawl budget on 11 authenticated routes. Fixed.
- **Blog articles had no structured data** — every other detail-page type (Hotel/Restaurant/CafeOrCoffeeShop/LocalBusiness/TouristAttraction/Event) already emits JSON-LD; blog articles didn't. Added `BlogPosting` schema to `app/[locale]/blog/[slug]/page.tsx`.
- `public/manifest.json` was missing the `scope` and `id` fields (Lighthouse-recommended, not required for installability) — added.

### What was investigated and deliberately *not* changed (with reasoning)
- **Index-as-key on removable list rows** (`opening-hours-editor.tsx`, `restaurant-form.tsx`, `cafe-form.tsx`, `my-business-form.tsx`) — flagged as a possible silent data-corruption risk when deleting a middle row. Traced through carefully: every input in these rows is a fully-controlled component (`value={item.x}`, no local/uncontrolled state), so React's reconciliation correctly re-syncs the displayed values after a removal even with a reused DOM node under a stale key — this is a best-practice smell, not a confirmed active bug. A proper fix (stable synthetic IDs) would mean changing a data shape used across the wider opening-hours parsing/display code for a non-confirmed risk, so it's left as a hardening recommendation rather than executed.
- **`lib/data/business.ts`/`owner-dashboard.ts` (18 call sites) never log Supabase query errors** — they already fail safe (`?? []`/`?? 0`, no throw, no user-facing breakage), the gap is purely diagnostic (no dev-console trail if a query silently starts failing). Deferred as a mechanical but non-urgent cleanup rather than a production-blocking issue.
- **`favorite-button.tsx` gives no feedback on a genuine (non-auth) favorite-toggle failure** — the heart icon can't end up in a wrong state (it only flips after a confirmed success), the user just gets no error toast for a rare Supabase-write failure. Adding a toast here means adding a dependency to this button's 11+ call sites for an edge case rarer than the offline case already fixed elsewhere — deferred.
- **3 admin tables have no mobile card fallback** (`admin/users`, `admin-bookings-list.tsx`, `claims-list.tsx`) — unlike `admin-list-table.tsx`/`city-services-list.tsx`, which already split into a card view under `sm:`. A real, if lower-traffic, responsive gap; deferred because building 3 new card layouts is a genuine design task, not a one-line fix, and risks a visual regression I can't check without a browser.
- **Service worker has no update-available prompt UX** — `sw.js` already does `skipWaiting()`/`clients.claim()` correctly, so users do get new content, just without a proactive "reload to update" banner. Building that banner is UI-addition-adjacent and was judged out of scope for a bug-fix pass.

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

**Fixed across both passes:**
- PostgREST filter-injection/breakage risk in every listing-search function (comma/parenthesis in a user query could error the query).
- `Permissions-Policy` was blocking the app's own legitimate geolocation feature (not a vulnerability, but a real functional bug with security-header root cause).
- Search silently falling back to mock data on empty real results (data-integrity issue, not exploitable, but a real production-correctness bug).
- Booking submission's core RPC call had no top-level try/catch (Pass 2) — an unexpected Supabase-layer failure would previously surface as an unhandled rejection rather than the form's normal error handling; not exploitable, but worth having in a security-adjacent robustness sense (predictable failure modes matter for anything handling guest PII).
- `robots.txt` now blocks `/*/business` alongside `/*/admin`/`/*/dashboard`/`/*/auth` (Pass 2) — consistent crawl-blocking for every authenticated section, not just most of them.

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
- [x] Offline behavior: every Server-Action call site reachable from an interactive component now fails gracefully (no unhandled rejections, no unrecoverable optimistic-UI state) when offline (Pass 2)
- [x] Memory leaks: every `useEffect` registering a listener/timer/subscription across the codebase audited; 2 real leaks found and fixed (Pass 2)
- [x] Loading states: all 6 listing types now have both list + detail loading states, plus city-map (Pass 2)
- [x] SEO: sitemap now includes every public listing type (services + destinations were missing), all detail-page types have JSON-LD structured data, robots.txt blocks all 4 authenticated sections (Pass 2)
- [x] PWA manifest, service worker registration, Android manifest, iOS Info.plist/entitlements/Xcode project all re-verified intact and consistent (Pass 2 — no regressions found from prior sessions' work)
- [ ] **Not done — requires a Mac with Xcode**: iOS Archive/IPA build, TestFlight upload (see prior session's iOS report — Xcode project is configured and ready, but the actual build step is a hard OS-level blocker in this environment)
- [ ] **Not done**: a dedicated Next.js/next-intl/@supabase-ssr major-version security upgrade (see Security Notes)
- [ ] **Not done**: live device/browser verification (Lighthouse score, actual gesture feel, cross-browser visual QA, real Android/iOS hardware) — everything above was verified via code review, `tsc`/`lint`/`build`, and dev-server HTTP smoke tests, not a real browser or device session

---

## Remaining Known Issues (not fixed this session, with reasons)

1. **Next.js 14 has multiple high-severity CVEs**, fix requires a breaking major-version upgrade — see Security Notes. This is the single most significant open item.
2. **Push notification device-token registration is a stub** — targeted pushes to specific devices don't work until a `device_push_tokens` table + server action exist (already scoped in a code comment).
3. **Admin/business-dashboard touch targets under 44px** in a handful of lower-traffic, primarily-desktop-used tooling screens (`feature-listing-button.tsx`, `pin-listing-button.tsx`, `offers-manager.tsx`, the 16px room-photo remove button) — not fixed, since these are business-owner/admin tools rather than public-facing UI, and resizing several of them risks a layout regression I can't visually verify in this environment.
4. **`formatDate` is reimplemented 6 times and `slugify` twice** across different files with near-identical logic — not broken, but worth consolidating into shared `lib/utils/` helpers in a future cleanup pass.
5. **Contact/review/claim-business forms rely on native HTML validation** rather than styled inline field-level errors (only the booking form has full pre-submit validation with translated messages) — consistent with the app's existing pattern, not a regression, but a reasonable future polish item.
6. **`getAllHotelSlugs()` still falls back to mock hotel slugs** if the real `hotels` table is ever briefly empty at build time (a `generateStaticParams` edge case) — low impact (those slugs would just 404 correctly when visited, since `getHotelBySlug` itself has no such fallback), left as-is rather than risking an unrelated change to static-generation behavior.
7. **No live device/browser testing** — this entire audit (both passes) was performed via source-code review, `tsc`/`lint`/`build`, and dev-server HTTP requests. Visual layout bugs, real touch-gesture feel, and an actual Lighthouse score are not verifiable from this environment and should be checked on a real device/browser before launch.
8. **3 admin tables have no mobile card fallback** (`admin/users`, `admin-bookings-list.tsx`, `claims-list.tsx`) — will horizontally scroll on phones instead of getting the card treatment the rest of the admin surface already has. A real UI-design task, not a one-line fix — deferred (Pass 2).
9. **`lib/data/business.ts`/`owner-dashboard.ts` (18 call sites) never log Supabase query errors** — already fail safe with no user-facing impact, purely a diagnostic-visibility gap (Pass 2).
10. **No service-worker "update available, reload?" prompt** — the SW already updates correctly under the hood (`skipWaiting`/`clients.claim()`), just without proactively telling the user (Pass 2).
11. **`favorite-button.tsx` gives no error feedback on a genuine (non-auth) toggle failure** — rare edge case, heart icon never shows a wrong state, just no error toast (Pass 2).

---

## Launch Readiness Score: **88%**

**Why not lower:** every core user flow (browsing all 6 listing types + events, search, booking, auth, offline caching, favorites, WhatsApp/Call/Maps actions) was traced through actual code and verified logically sound across two independent audit passes; real, concrete bugs were found and fixed rather than glossed over — including, in Pass 2, a category of bug specifically relevant to this app's offline-first design (unhandled rejections and un-rolled-back optimistic UI when Server Actions are called offline) and a missing top-level error handler on the booking flow's core RPC call. The build/lint/typecheck/i18n-parity pipeline remains fully clean, SEO coverage is now complete (sitemap, structured data, robots.txt), and every loading-state gap found is fixed.

**Why not higher:** one significant, real security item (the Next.js CVE set) is still explicitly deferred pending a dedicated upgrade cycle, unchanged from Pass 1; a handful of lower-priority polish items remain, now with a fuller and more precisely-scoped list (admin table mobile fallback, diagnostic logging gaps, a missing SW update prompt); and — still the largest caveat — nothing in either pass was verified in an actual browser or on a real device, only through code review and HTTP-level checks. The 3-point increase from Pass 1 reflects real, verified fixes to real gaps (particularly around offline robustness and SEO completeness), not a change in that fundamental limitation.
