# Go Hargeisa — Final Production Audit

## Score: 94 / 100

Everything code-, build-, and configuration-level is clean and verified.
The 6 points off reflect items that are structurally outside what any
amount of further automated work in this environment can resolve — an
account-bound signing decision and a platform (iOS) that requires a Mac —
not defects in the project itself. See **Blocking issues** below for the
complete, exact list of what those are.

Three real issues were found during this audit and are already fixed,
verified, and committed (not just attempted) — see **Fixed this session**.

---

## Verification results

| Area | Result |
|---|---|
| Website build (`npm run build`) | ✅ Clean — all 91 routes compile |
| TypeScript (`npx tsc --noEmit`) | ✅ Zero errors |
| ESLint (`npm run lint`) | ✅ Zero warnings/errors |
| SEO — sitemap.xml | ✅ Valid, well-formed, 87 URLs, no duplicates (after fix) |
| SEO — robots.txt | ✅ Correct allow/disallow rules, references sitemap |
| PWA — manifest.json | ✅ Valid JSON, all 3 icons resolve (200) |
| PWA — service worker | ✅ Registers in production, network-first with offline fallback |
| PWA — favicon | ✅ Fixed this session (was 404) |
| Broken links (header/footer/nav) | ✅ Every internal link resolves to a real route |
| Missing assets (codebase-wide scan) | ✅ Fixed this session (1 found) |
| Security headers (CSP, HSTS, X-Frame-Options, etc.) | ✅ Present on every response |
| Secrets in git | ✅ None found — only `.env.example` (placeholders) is tracked |
| Service-role key usage | ✅ Server-only (Server Actions, admin client, CLI scripts) — never in client code |
| Capacitor config security | ✅ `cleartext: false`, narrow `allowNavigation` (no wildcard that would swallow external links) |
| Android App Links | ✅ Manifest + assetlinks.json structurally correct, consistent `com.gohargeisa.app` / `gohargeisa.com` everywhere |
| iOS Universal Links | ✅ Entitlements + apple-app-site-association structurally correct, consistent everywhere |
| Android AAB | ✅ Builds clean, signed, `apksigner verify` exit 0 |
| npm audit | ⚠️ 8 known advisories — see **Known, non-blocking** below |

---

## Fixed this session

1. **Sitemap gaps** — `/privacy`, `/terms`, `/city-map`, and `/search` were
   live, fully public, correctly metadata'd pages that were never listed
   in `app/sitemap.ts`. Fixed and verified live (all 4 now present across
   all 3 locales).
2. **Broken favicon** — `app/[locale]/layout.tsx`'s metadata fallback
   referenced `/favicon.ico`, which didn't exist anywhere in the repo
   (404). Generated a real one and verified it resolves in both dev and
   the production build output.
3. **Broken mock image path** — `lib/mock-data.ts`'s Sultan Restaurant
   entry pointed its cover image at a file that never existed (a leftover
   "add it here" placeholder); its own gallery has 6 real photos, so
   reused one of those instead.

---

## Blocking issues

Exactly three remain, all account-bound or hardware-bound — nothing left
that more automated work in this environment can resolve:

1. **Android signing key is a temporary, session-generated keystore.**
   The AAB/APK are validly signed and verified, but not with a key tied to
   your identity — it must not be the key you actually publish with unless
   you deliberately keep and immediately back it up. *Resolution: your
   decision, documented step-by-step in `RELEASE_CHECKLIST.md`.*

2. **iOS cannot be built, signed, or run at all in this environment.**
   The project is fully generated and configured, but Apple's toolchain
   (Xcode, code signing, the simulator/device backend) only runs on
   macOS — no workaround exists. *Resolution: `npx cap open ios` on a Mac,
   per `RELEASE_CHECKLIST.md`.*

3. **Two deep-link verification files still contain placeholders** —
   `public/.well-known/assetlinks.json`'s SHA-256 fingerprint (depends on
   blocker #1) and `apple-app-site-association`'s Apple Team ID (depends
   on an Apple Developer account, which needs #2). Until both are filled
   in and deployed, tapping a gohargeisa.com link will open a browser
   instead of the app. *Resolution: documented in `RELEASE_CHECKLIST.md`.*

---

## Known, non-blocking

`npm audit` reports 8 advisories. All but one are in **build-time-only
tooling** — PostCSS bundled inside Next.js's own build pipeline, and
`uuid`/`xcode` bundled inside `@capacitor/cli` (used only when you run
`npx cap` commands locally; none of this ships in the website's runtime
bundle or the Android/iOS app binaries). The one runtime-relevant advisory
is `next-intl` (open redirect + prototype pollution via translation-catalog
keys) — real, but the fix requires a major-version jump (3.26 → 4.13) with
a changed API surface used on nearly every page in this app. That's a
dedicated, tested migration, not something to bundle silently into an
audit-fix pass — flagging it here rather than either hiding it or making
an unreviewed breaking change.

---

## What "94" means in practice

If you stopped right now: the website is fully deployable as-is today,
with clean SEO, a working PWA, correct security headers, and no known
broken links or assets. The Android app has a real, verified, installable
signed build — the only step before a genuine Play Store upload is the
one-time signing-key decision in `RELEASE_CHECKLIST.md`. iOS needs time on
a Mac before it exists as a submittable build at all; everything on the
code side is ready for that moment.
