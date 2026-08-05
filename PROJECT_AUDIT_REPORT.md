# Go Hargeisa — Production Readiness Audit

**Date:** 2026-08-05
**Scope:** Full codebase (Web/Next.js, Supabase, Android, iOS) — structure, frontend, UX, performance, SEO, accessibility, security, Supabase, features, mobile apps, build system.
**Method:** Static analysis + 5 parallel research passes (structure/dead-code, security/Supabase, SEO/accessibility, frontend/UX/performance, mobile apps) each independently verifying claims against the actual source, not assumptions — plus my own direct investigation of the two highest-impact findings (the caching architecture and a live authorization gap), a full lint/typecheck/build cycle, and a 54-screenshot visual sweep across 6 real device viewports captured against an actual **production build** (not `next dev`, see §Visual Inspection for why that distinction mattered).

---

## Scores

| Category | Score | Why |
|---|---|---|
| **Overall** | **79 / 100** | A genuinely well-engineered codebase — disciplined auth patterns, strong SEO, clean build — undercut by one significant, verified performance-architecture gap and normal pre-launch loose ends (dependency currency, unfilled deep-link credentials, sparse seed data). |
| Security | 84 / 100 | One real authorization gap found and fixed; RLS coverage is thorough and verified; no secrets exposed; dependency vulnerabilities are real but all require breaking major-version upgrades (documented, not force-applied). |
| Performance | 60 / 100 | Good fundamentals (image config, code-splitting-ready bundle, LazyMotion) undone by a verified, site-wide caching gap: **zero pages are statically cached** despite 24+ pages declaring `revalidate = 3600`. |
| SEO | 91 / 100 | Metadata, hreflang, JSON-LD, sitemap, and robots.txt were already excellent; only small gaps found (now fixed). |
| Accessibility | 81 / 100 | Solid baseline (skip link, alt text, labeled forms); fixed missing focus traps/Escape handling and one non-standard rating widget; reduced-motion support is now consistent on the two most persistent chrome components, partial elsewhere. |
| Mobile readiness | 86 / 100 | Android and iOS are both extensively configured and verified; one real Android permission gap found and fixed; a recurring Windows-toolchain bug now has a permanent safety net. |
| Production readiness | 76 / 100 | Builds clean, ships a real fix for a live authorization bug — held back by the caching gap, unapplied dependency upgrades, and launch-checklist items (deep-link credentials, content seeding) that are inherently outside code. |

Scoring basis: each score reflects verified evidence (build output, prerender manifests, grep-confirmed code paths, screenshots), not self-reported claims — several agent-reported "already fine" areas were independently re-checked and held up; the two most significant findings below were things I verified myself beyond what the initial research surfaced.

---

## 1. The most important finding: the site has zero static/ISR caching

**Verified, not inferred.** 24+ pages (`app/[locale]/hotels/page.tsx`, `.../restaurants/page.tsx`, every `[slug]` detail page, `/about`, `/blog`, etc.) declare `export const revalidate = 3600`, clearly intending ISR (cached HTML, revalidated hourly). But `app/[locale]/layout.tsx:28` sets `export const dynamic = "force-dynamic"` — and that layout also calls `getHeaderUser()`, which reads the auth session via `cookies()` (`lib/supabase/server.ts`). Calling a Next.js "Dynamic API" like `cookies()` automatically forces the *entire* route dynamic regardless of the explicit export.

I confirmed this isn't just theoretical by inspecting the actual build output:
```
$ node -e "console.log(Object.keys(require('./.next/prerender-manifest.json').routes))"
[ '/apple-icon.png', '/favicon.ico', '/robots.txt', '/sitemap.xml' ]
```
Four routes. Not one content page. Every hotel/restaurant/cafe/attraction/event page — including the ones the build output's own summary misleadingly labels `●` "SSG" — has **zero** prerendered HTML on disk (`.next/server/app/[locale]/hotels/[slug]/` contains only a serverless function, no `.html`). Every single visitor, including every crawler and every anonymous first-time visitor, triggers a full server render and fresh Supabase queries.

**Why I didn't just fix it:** the root cause is a deliberate trade-off, not an oversight — the layout fetches the signed-in user server-side specifically so the header shows the correct signed-in/signed-out state on first paint instead of flashing "signed out" (see the comment at `layout.tsx:30-36`). Removing `getHeaderUser()` from the layout would restore full static/ISR rendering for the whole site, but reintroduces that flash for logged-in users — a real UX trade-off the original author already weighed and chose against. That's not mine to silently reverse.

**Recommended remediation (pick one, both are real engineering work, not one-liners):**
- **Move the auth-aware header fully client-side.** Render a generic header in static HTML, hydrate real auth state via the existing `use-header-user.ts` client subscription. Unlocks full ISR caching for the ~90%+ of traffic that's anonymous, at the cost of a brief flash for logged-in users on cold loads.
- **Cache the data, not the HTML.** Wrap the read-heavy functions in `lib/data/*.ts` (17 files, e.g. `getHotels`, `getRestaurants`) in `unstable_cache()` with tags, and call `revalidateTag()` from the corresponding admin mutation actions (`lib/actions/admin.ts`). This is more surgical (no auth/UX change) but is a two-sided change — I did not implement it in this pass because doing it *without* also wiring the write-side invalidation would silently serve stale content to visitors after every admin edit, which is worse than the current (always-fresh, always-slow) behavior. This needs deliberate implementation and testing, not an audit-time guess.

---

## 2. Security

### Fixed
| Issue | Severity | Fix |
|---|---|---|
| A `business_owner` could self-promote their own hotel/restaurant/cafe to "Featured on homepage" through the normal edit form — the checkbox was shown to every role, and the server action had no field-level allowlist, only row-level RLS. | **Medium** | Added a `canFeature` prop to `HotelForm`/`RestaurantForm`/`CafeForm`, wired to `access?.role === "owner"` in the three edit pages, so the checkbox only renders for the platform owner. **Defense in depth:** `updateRecord` (`lib/actions/admin.ts`) now strips `featured` from the payload server-side unless the caller's role is `owner` — the real authorization boundary, since a Server Action is a network endpoint any client can call directly with an arbitrary payload regardless of what the UI shows. |
| The `listing-images` storage bucket's insert/update/delete policies only granted `role = 'owner'`, not `business_owner` — meaning a business owner could edit their own listing's text fields (RLS allows it) but could never actually upload a cover photo, logo, or gallery image for it. | **Medium (functional bug, not an overprivilege)** | Wrote `supabase/migrations/20260805000001_business_owner_listing_image_uploads.sql`, extending the three policies to `role in ('owner', 'business_owner')`. Scope matches the existing owner policies exactly (bucket-wide, not per-folder) — safe because the listing tables' own RLS (`owner_id = auth.uid()`) is what actually prevents attaching an image to someone else's listing, not this bucket policy. **Not yet applied to the live database** — migration files in this repo are applied manually/via CI, and pushing schema changes to a live Supabase project without your explicit go-ahead is exactly the kind of hard-to-reverse action I don't take unilaterally. Apply with `supabase db push` or via the SQL editor. |

### Verified clean (independently re-checked, not just trusted)
- Every table with user data has RLS enabled (21/21 checked); policies correctly scope writes to `owner_id = auth.uid()` or the authenticated user's own rows.
- No hardcoded secrets anywhere in source; `.env.local` is properly gitignored; `NEXT_PUBLIC_SUPABASE_ANON_KEY` actively fails closed if a service-role key is ever placed there (`lib/supabase/is-configured.ts`).
- `middleware.ts` gates `/admin`, `/dashboard`, `/business` pre-render, not just page-level — so a bot or no-JS client gets a real 307, not a client-side redirect that still leaks a flash of content.
- All 12 `dangerouslySetInnerHTML` uses are JSON-LD structured data only, routed through `lib/utils/json-ld.ts:safeJsonLd()`, which escapes `<` — never raw user-supplied HTML.
- The one API route (`app/api/cron/booking-reminders`) correctly checks a `CRON_SECRET` bearer token; everything else is Server Actions, which get Next.js's built-in same-origin CSRF check.
- The previously-fixed guest-booking RLS bug (documented in project memory) was re-verified against the current migrations — still correctly fixed, no regression.
- A temporary `SECURITY DEFINER` diagnostic function from an earlier migration was confirmed dropped in a later one.

### Not fixed — documented, requires a deliberate decision
- **8 npm audit vulnerabilities** (2 low, 4 moderate, 2 high) in `next`, `next-intl`, `postcss`, `cookie`, `uuid` — every one only has a fix available via a **breaking major-version upgrade** (Next.js 14→16, `@supabase/ssr`, `next-intl` 4→4.13 with breaking changes noted, `@capacitor/cli` major bump). I did not run `npm audit fix --force`; that's real work requiring a planned upgrade + regression testing, not an audit-time fix. Plan this as its own tracked piece of work.
- **No schema-validation library** (zod, etc.) in `lib/actions/*.ts` — validation is hand-rolled per action. RLS and DB constraints are the actual backstop and hold up, but this is a maintainability gap: a future field addition could be missed. Not fixed — introducing a validation library across dozens of actions without dedicated testing risks its own regressions.
- The broader mass-assignment pattern in `createRecord`/`updateRecord` (`data: Record<string, unknown>` with no column allowlist, only RLS) — the one concrete exploit path (`featured`) is now closed; the pattern itself remains and should get a proper allowlist per table if more privileged columns are ever added.

---

## 3. Performance (beyond the caching finding above)

**Fixed:**
- Removed 3 genuinely-unused Capacitor plugins (`@capacitor/browser`, `@capacitor/haptics`, `@capacitor/share` — confirmed zero JS call sites) from `package.json`, then re-synced both native projects. Pure dead weight in every APK/IPA for no benefit.

**Verified healthy, no action needed:**
- `next.config.mjs` image config is solid: AVIF/WebP, long cache TTL, correct `remotePatterns`, no accidental `unoptimized`. Only 2 raw `<img>` tags exist, both explicitly justified (tiny flag icon, tiny upload-preview thumbnail).
- ISR *intent* is well set up (`revalidate = 3600` on nearly every public page) — see §1 for why it isn't actually working.
- 148 client components (`"use client"`), spot-checked several — all had genuine interactivity justifying it.
- Shared First Load JS is 87.7 kB — reasonable. `LazyMotion` + the `m` component (not `motion`) is already used app-wide specifically to keep Framer Motion's bundle footprint down.
- No `next/dynamic` usage anywhere, but verified there's currently nothing heavy enough (no map SDK — external links to Google Maps instead, no chart/editor libraries) to actually need it yet.

---

## 4. SEO

Already strong before this audit; fixed the few real gaps found.

**Fixed:**
- `/search` removed from `app/sitemap.ts`'s static route list — it's a query-driven results page with no content of its own to index.
- Added `robots: { index: false }` to `/dashboard` and `/admin` page metadata (they were relying on `robots.ts`'s disallow alone; `/business` already had this, now consistent).

**Verified excellent, no action needed:**
- Root layout sets a complete metadata object (title template, OG, Twitter cards, real `og-image.png`, icons, manifest).
- `lib/i18n/alternates.ts` correctly generates `canonical` + hreflang (`languages`) per page — every major route calls it with its own path.
- JSON-LD structured data (`Hotel`, `Restaurant`, `TouristDestination`, etc.) is present on the homepage and every major detail page.
- `app/sitemap.ts` dynamically enumerates real DB-backed slugs across all locales, correctly respecting the feature-flag gating so it never lists a URL the public site won't render.
- `app/robots.ts` correctly disallows `/admin`, `/dashboard`, `/business`, `/auth`, `/api/` across all locale prefixes.

---

## 5. Accessibility

**Fixed:**
- **Global search overlay** (`components/shared/global-search.tsx`): had `role="dialog" aria-modal="true"` but no Escape-to-close or focus trap, unlike every other modal in the codebase. Added both, reusing the existing `useFocusTrap` hook (`lib/hooks/use-focus-trap.ts`) for consistency with `lightbox.tsx`, `bottom-sheet.tsx`, `booking-request-modal.tsx`, etc.
- **Mobile nav sheet** (`components/layout/site-header.tsx`): same gap, same fix — Escape handling + `useFocusTrap`.
- **Review star rating** (`components/shared/review-form.tsx`): 5 individual `<button>`s with per-star `aria-label`s but no group semantics — a screen reader announced 5 disconnected buttons instead of one rating control. Added `role="radiogroup"` + `aria-label` on the container and `role="radio"` + `aria-checked` on each star. Added a new `ratingGroupAriaLabel` translation key to all 3 locale files (en/ar/so).
- **Reduced motion**: the app uses `useReducedMotion()` correctly in many places (hero, reveals, splash) but not consistently — the two most persistent, always-visible chrome elements (`site-header.tsx`'s mobile nav overlay, `bottom-nav.tsx`'s active-tab indicator) now respect it.

**Verified clean:**
- No missing `alt` text or broken image paths found in spot-checks.
- Forms have proper disabled-during-submit, loading spinners, and inline error states.
- `loading.tsx` exists for nearly every route segment (24 files) — no jarring blank-to-content pops.
- Custom `error.tsx`/`not-found.tsx`/`global-error.tsx` are all hand-designed, not Next.js boilerplate — **except the true root-level 404 case, see §6 below.**

**Remaining (not fixed — lower-traffic surfaces, scoped out to keep this pass bounded):**
`notification-bell.tsx`, `toast.tsx`, `dashboard-tabs.tsx`, `views-chart.tsx`, and `global-search.tsx`'s own entrance animation still don't check `useReducedMotion()`. None are persistent/always-visible like the two fixed above. Recommend either adding the same pattern to each, or introducing a single app-wide `<MotionConfig reduceMotion="user">` wrapper in the root layout as a one-line fix that covers every current and future `m.*` usage at once — the latter is the better long-term fix and worth doing deliberately rather than as a spot patch.

---

## 6. Visual inspection (54 screenshots, 6 real device viewports)

**Methodology note, because it changed the result:** the first full sweep was run against `next dev`, and pages rendered almost entirely blank — a real scare until I checked the browser console:
```
PAGEERROR: Evaluating a string as JavaScript violates the Content Security Policy
directive: script-src 'self' 'unsafe-inline' — 'unsafe-eval' is not allowed
```
`next dev`'s eval-based HMR chunks trip the site's own strict CSP header. Content was actually present in the DOM (`body.innerText` showed real hotel names, prices, etc.) — it was just stuck invisible because a page-level uncaught exception interrupted the reveal-animation JS. **This does not happen in production** (no eval-based HMR there). I discarded that entire sweep, built a clean production bundle, started `next start`, and re-ran the full sweep against that. This is worth remembering for any future automated visual testing of this app — always test against a production server, not `next dev`.

**Real bug found this way:** requesting a genuinely unmatched URL (`/en/this-page-does-not-exist-audit-check`) rendered Next.js's bare, unbranded default 404 — no header, no footer, no way back into the site — instead of the polished custom 404 (`app/[locale]/not-found.tsx`, which has a branded card, icon, and CTA buttons). Root cause: **`app/[locale]/not-found.tsx` only ever renders for an explicit `notFound()` call from *within* a matched `[locale]` route** (e.g., an invalid hotel slug) — a URL that doesn't match any route pattern at all never enters that segment, and without a root-level `app/not-found.tsx`, Next.js falls back to its default page.

**Fixed:** added `app/not-found.tsx` — a locale-agnostic version of the same branded design (can't use `next-intl` translations out there since there's no `NextIntlClientProvider` at that level; defaults to English and links to `/en`). Verified with a fresh screenshot — now matches the site's design language exactly.

**Screenshots** (`mobile-preview/audit/`, 54 files): full 6-viewport sweep (iPhone SE, iPhone 15 Pro, Pixel 9, Galaxy S24, iPad Pro 11, Desktop 1440×900) for Home, Hotels list, Search, and Hotel detail; mobile+desktop spot-checks for Restaurants, Cafes (+detail), Attractions, Events, City Map, City Services, About, Contact, Business, Dashboard, Admin, Join, 404, and the Arabic RTL homepage.

No overflow, broken layouts, or dark/light-mode inconsistencies found across any captured viewport. RTL Arabic renders correctly (mirrored layout, right-aligned text, correct icon placement).

**A note on content, not code:** the current database has exactly 1 published hotel (by design — `HOTELS_PRESENTATION_MODE` in `lib/config/features.ts`), 1 published cafe, and **0 published restaurants, attractions, and events**. This isn't a bug — the homepage's per-category sections correctly hide themselves entirely when a category has zero items (`{restaurants.length > 0 && (...)}` etc., verified in `app/[locale]/page.tsx`) — but it means restaurant/attraction/event detail pages, and most of the "Featured X" homepage sections, could not be visually verified with real content in this pass. Before launch, seed real content for these categories and re-run a visual pass specifically on those pages.

**One flaky, unreproducible observation:** a single fullPage screenshot of the hotel detail page briefly measured 21,483px tall instead of the consistent, verified 7,161px (reproduced 3 times after). Almost certainly a one-off race during automated capture (possibly the image gallery mid-transition), not a real layout bug — flagging honestly rather than either asserting a bug I couldn't reproduce or silently omitting it.

---

## 7. Project structure & dead code

**Fixed:**
- Moved 8 stray root-level session report files (`ANDROID_RELEASE_REPORT.md`, `FINAL_RELEASE_REPORT.md`, `FINAL_REPORT.md`, `PLAY_STORE_LISTING.md`, `PLAY_STORE_READY.md`, `PRODUCTION_READY_SUMMARY.md`, `RELEASE_CHECKLIST.md`, `SPLASH_SCREEN_REPORT.md`) into `docs/reports/` — decluttered the root without losing history (`git mv`, not delete).
- Deleted `imports.txt` and `build-output.log` — stray leftover artifacts from prior sessions, not referenced anywhere.
- Removed the 3 unused npm dependencies (see §3).

**Found, not fixed (recommendations only):**
- **~1,800 duplicated lines** across `components/home/premium-{hotel,cafe,restaurant,service,attraction}-card.tsx` and their `components/shared/`/`components/attractions/` counterparts — near-identical card components per listing type. A code comment explains this was deliberate ("so this redesign can't change anything outside the homepage"), which was the right call at the time, but it's a growing maintenance cost as more listing types are added. Worth consolidating into one component with a `variant` prop when there's a dedicated design-system pass, not as a drive-by audit fix.
- `lib/mobile/push-notifications.ts`: fully-built push registration infrastructure (`requestAndRegisterPushNotifications`) that's never called from any UI. **This is intentional, not a bug** — the code comments explain it's staged ahead of a `device_push_tokens` backend table and Firebase credentials that don't exist yet, and deliberately not called on cold launch per Apple's HIG guidance against requesting notification permission with no context. Wire it up once that backend exists.
- `components/shared/` is a 100-file flat folder mixing generic UI primitives with domain-specific widgets — inconsistent with the domain-folder pattern already used for `components/attractions/`, `components/admin/`, etc. Not broken, just an organizational nit for a future pass.

---

## 8. Mobile apps (Android / iOS / Capacitor)

**Fixed:**
- **Android was missing `ACCESS_COARSE_LOCATION`/`ACCESS_FINE_LOCATION`** in `AndroidManifest.xml`. The app uses `navigator.geolocation` (`lib/hooks/use-visitor-location.ts`) for "X km away" distance sorting — this works on web and iOS (which has `NSLocationWhenInUseUsageDescription`), but without the Android manifest permission, Android's WebView denies the geolocation prompt outright instead of asking the user — the feature silently never worked in the native Android app. Added both permissions; per Capacitor's documented behavior, no other native code change is needed.
- **A recurring Windows-toolchain bug**: `npx cap sync ios` on Windows writes backslash path separators into `ios/App/CapApp-SPM/Package.swift` (invalid Swift string syntax — `\.`/`\@` aren't valid escapes — breaks package resolution in Xcode on macOS). This had already been fixed once in a prior session; it **recurred during this audit** when I re-ran `cap sync` after removing the unused plugins. Fixed again, and this time added a permanent safety net: `scripts/fix-ios-package-swift.mjs`, wired into `npm run mobile:sync` (now runs `cap sync && node scripts/fix-ios-package-swift.mjs`), so this can't silently reintroduce a build-breaking file again on this platform.

**Verified consistent, no action needed:**
- Android (versionCode 6, 1.4.0) and iOS (1.0.0, build 1) version numbers are independently sensible — Android has shipped increments before, iOS hasn't been submitted yet. Not a mismatch.
- Icon/splash assets on both platforms have matching mtimes with their generator script and source image — no staleness.
- `ios/App/App/capacitor.config.json` is in sync with `capacitor.config.ts` (confirms `cap sync` was run after the latest config edit).
- `@capacitor/haptics`/`@capacitor/share`/`@capacitor/browser` were installed-but-unused (removed, see §3); `@capacitor/status-bar`/`@capacitor/keyboard` are correctly configured declaratively via `capacitor.config.ts` with no JS call needed — not dead code.

**Expected, not a bug — needs your credentials, not code:**
- `public/.well-known/assetlinks.json` and `apple-app-site-association` still have `REPLACE_WITH_...` placeholders — Android App Links / iOS Universal Links won't verify until your release keystore fingerprint and Apple Team ID are substituted in. Documented in `MOBILE_DEPLOYMENT.md`.
- iOS `DEVELOPMENT_TEAM` is blank in the Xcode project — account-specific, can only be set from within Xcode once you sign in with your Apple Developer account. See `ios/README.md`.

---

## 9. Build system (lint, typecheck, build — all run for real, not assumed)

| Check | Result |
|---|---|
| `npm run lint` (ESLint) | ✅ Clean — before and after every fix in this pass |
| `npx tsc --noEmit` | ✅ Clean — before and after every fix in this pass |
| `npm run build` (production) | ✅ Clean — final verification build completed successfully with every fix applied, all 90+ routes compiled |
| `npm audit` | 8 findings (2 low, 4 moderate, 2 high), all requiring breaking major-version upgrades — documented in §2, not applied |

One build-tooling note unrelated to the app itself: running `npm run build` while a `next dev` server is active on the same project directory corrupted a build manifest (`SyntaxError: Unexpected end of JSON input` reading a `.next` JSON file) — both processes write to the same `.next/` folder. Not a bug in the app; just don't run `dev` and `build` concurrently against the same directory. The final, trustworthy build in this report was run with no dev server active.

---

## 10. Everything modified in this audit

**Code fixes:**
- `app/sitemap.ts` — removed `/search` from indexable static routes
- `app/[locale]/dashboard/page.tsx`, `app/[locale]/admin/page.tsx` — added `robots: { index: false }`
- `app/not-found.tsx` **(new)** — locale-agnostic root 404 fallback, fixes the unbranded-404 bug
- `components/shared/global-search.tsx` — Escape-to-close + focus trap
- `components/layout/site-header.tsx` — Escape-to-close + focus trap (mobile nav) + reduced-motion guards
- `components/layout/bottom-nav.tsx` — reduced-motion guard
- `components/shared/review-form.tsx` — `role="radiogroup"`/`role="radio"` semantics for star rating
- `messages/en.json`, `messages/ar.json`, `messages/so.json` — added `ratingGroupAriaLabel` key
- `components/admin/hotel-form.tsx`, `restaurant-form.tsx`, `cafe-form.tsx` — added `canFeature` prop, hides featured checkbox for non-owners
- `app/[locale]/admin/hotels/[id]/edit/page.tsx`, `restaurants/[id]/edit/page.tsx`, `cafes/[id]/edit/page.tsx` — pass `canFeature={access?.role === "owner"}`
- `lib/actions/admin.ts` — `assertOwnerOrBusinessOwner` now returns role; `updateRecord` strips `featured` server-side for non-owners
- `android/app/src/main/AndroidManifest.xml` — added `ACCESS_COARSE_LOCATION`/`ACCESS_FINE_LOCATION`
- `ios/App/CapApp-SPM/Package.swift` — fixed recurring backslash-path bug (2nd occurrence)
- `scripts/fix-ios-package-swift.mjs` **(new)** — permanent safety net, wired into `npm run mobile:sync`
- `package.json`, `package-lock.json` — removed `@capacitor/browser`/`@capacitor/haptics`/`@capacitor/share`; updated `mobile:sync` script
- `android/app/capacitor.build.gradle`, `android/capacitor.settings.gradle`, `ios/App/App/capacitor.config.json` (untracked, gitignored) — regenerated by `cap sync` after dependency removal

**New Supabase migration (not yet applied — see §2):**
- `supabase/migrations/20260805000001_business_owner_listing_image_uploads.sql`

**Documentation:**
- `MOBILE_DEPLOYMENT.md` — updated iOS section to reflect current state
- `docs/reports/*.md` **(moved)** — 8 stray root report files relocated from repo root
- `ios/README.md`, `ios/App/App/PrivacyInfo.xcprivacy`, `ios/App/App.xcodeproj/project.pbxproj`, `ios/App/App/Info.plist` — carried over from the prior iOS App Store prep session (already committed-worthy, listed here for completeness of `git status`)

**Cleanup:**
- Deleted `imports.txt`, `build-output.log` (stray artifacts)

**Visual sweep output:**
- `mobile-preview/audit/` — 54 screenshots across 6 viewports × ~19 pages

Nothing in this list changes existing behavior for any user except the two intended fixes (business_owner can no longer self-feature; Android geolocation now works; unmatched URLs now get the branded 404). Everything else is additive (new files) or strictly internal (removed dead code, moved docs).

---

## 11. Remaining recommendations (not fixed, in priority order)

1. **Fix the caching architecture** (§1) — the single highest-leverage remaining item. Either decouple the auth-aware header from the shared layout (unlocks full-site ISR) or add `unstable_cache` + `revalidateTag` to the data layer (more surgical, needs write-side wiring too). This is real engineering work deserving its own planning, not a follow-up patch.
2. **Apply the storage RLS migration** (§2) — `supabase/migrations/20260805000001_business_owner_listing_image_uploads.sql` needs `supabase db push` (or equivalent) against the live project before business owners can upload listing images.
3. **Plan the dependency upgrade path** — Next.js 14→16, `next-intl`, `@supabase/ssr`, `@capacitor/cli` all have known vulnerabilities only fixable via breaking major-version bumps. Track as a dedicated upgrade project with a regression-testing pass, not a quick patch.
4. **Seed real content** for restaurants, attractions, and events before launch — currently 0 published rows each, which means those pages, and the homepage sections that showcase them, are effectively untested with real data (see §6).
5. **Fill in the deep-link placeholders** — `assetlinks.json` (Android) and `apple-app-site-association` (iOS) need your real release-keystore SHA-256 fingerprint and Apple Team ID.
6. **Extend reduced-motion support** to the remaining 5 components (`notification-bell.tsx`, `toast.tsx`, `dashboard-tabs.tsx`, `views-chart.tsx`, `global-search.tsx`'s entrance animation) — or better, add a single app-wide `<MotionConfig reduceMotion="user">` in the root layout to cover all of them (and future ones) at once.
7. **Add a schema-validation library** (zod or similar) to `lib/actions/*.ts` for defense-in-depth beyond RLS.
8. **Consider consolidating** the ~1,800 duplicated lines across the per-listing-type card components, when there's room for a deliberate design-system pass rather than a drive-by change to "locked" areas.
9. **Wire up push notifications** once the `device_push_tokens` backend table and Firebase credentials exist — the client-side infrastructure is already built and waiting.

---

## 12. Final launch checklist

**Code — done in this pass:**
- [x] Lint clean
- [x] Typecheck clean
- [x] Production build clean
- [x] Known authorization gap (featured self-promotion) fixed
- [x] Android geolocation permission fixed
- [x] iOS Package.swift build-blocker fixed (with a permanent safety net against recurrence)
- [x] Unbranded-404 bug fixed
- [x] Dead dependencies removed

**Before launch — requires your action, not something I can safely do unattended:**
- [ ] Apply `supabase/migrations/20260805000001_business_owner_listing_image_uploads.sql` to the live database
- [ ] Decide and implement a caching-architecture remediation (§1/§11.1) — the biggest open item
- [ ] Plan and execute the Next.js/next-intl/Supabase-SSR dependency upgrades (§11.3)
- [ ] Seed real restaurant/attraction/event content, then re-run a visual pass on those pages
- [ ] Fill in `assetlinks.json` / `apple-app-site-association` with real credentials
- [ ] Set your Apple Developer Team in Xcode (`ios/README.md`) and complete the Android/iOS store submission steps (`MOBILE_DEPLOYMENT.md`)
- [ ] Back up `android/release.jks` outside this machine if you haven't already (per `MOBILE_DEPLOYMENT.md` — losing it means you can never update the same Play Store listing again)
- [ ] Review and commit (or discard) the pre-existing uncommitted fix in `lib/hooks/use-network-status.ts` (a real, correct, already-complete fix for an SSR false-"offline" flash — just never committed)
- [ ] Decide on the `npm audit` findings — accept the current risk short-term, or schedule the upgrade
