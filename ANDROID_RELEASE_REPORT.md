# Go Hargeisa — Android Release Report

**Date:** 2026-08-05
**Build:** versionCode `3`, versionName `1.2.0` (previous release: versionCode 2 / 1.1.0)

## What's in this release

This is a rebuild of the Android app capturing everything since the last native build: the full offline-first caching feature, the iOS production-config pass, the production-readiness audit, and the senior QA pass (offline-behavior fixes, memory-leak fixes, SEO fixes) — see `FINAL_RELEASE_REPORT.md` for the complete list of what changed in the web app itself. Because this is a remote-URL Capacitor shell (the WebView loads the live `https://gohargeisa.com`), none of those web-app fixes required touching native code — they ship the moment the website deploys, which was independently confirmed live (see below). This rebuild exists to produce fresh signed binaries at a bumped version, and along the way found and fixed one more real bug.

## Bug found and fixed during this rebuild

**`public-mobile/icon.png` was a 944KB, 1254×1254 uncompressed image displayed at 68px** on the native offline-fallback page (`public-mobile/offline.html`) — the same class of bug fixed for the PWA manifest icons in the last QA pass, just in a different file that pass didn't cover. Because Capacitor bundles `public-mobile/` directly into the app's assets, this file was shipping inside **every** Android and iOS build. Regenerated at 256×256 (52KB, clean retina headroom for a 68px display) via `scripts/generate-mobile-assets.mjs`, which now covers this file going forward.

**Effect:** the release APK dropped from 3.32MB → **2.47MB** (−25.5%), the AAB from 4.10MB → **3.27MB** (−20.3%) — a real, user-facing download-size improvement, not just a version bump.

## Build steps executed

1. `android/app/build.gradle`: `versionCode 2 → 3`, `versionName "1.1.0" → "1.2.0"`.
2. `npm run build` — production Next.js build, clean.
3. `npx cap sync android` — synced web assets + all 10 Capacitor plugins.
4. Found and fixed the icon bug above; re-ran `node scripts/generate-mobile-assets.mjs`; re-synced.
5. `./gradlew clean bundleRelease assembleRelease` — clean build, both succeeded.

## Verification

### Signing
| Artifact | Tool | Result |
|---|---|---|
| APK | `apksigner verify --print-certs` | ✅ Valid — `CN=Go Hargeisa, OU=Mobile, O=Go Hargeisa, L=Hargeisa, ST=Woqooyi Galbeed, C=SO`, SHA-256 `e3e32048…d9960d5` |
| AAB | `jarsigner -verify` | ✅ `jar verified.` (same cert; the self-signed/no-timestamp warnings jarsigner prints are expected and normal for an app-signing key, not a problem) |

Both signed by the identical certificate used for every prior release build — confirms signing continuity (this keystore can upgrade the same Play Store listing).

### Version
Confirmed via `aapt dump badging` on the actual built APK (not just the source config):
```
package: name='com.gohargeisa.app' versionCode='3' versionName='1.2.0'
```

### No debug flags
- `aapt dump badging` output has **no** `application-debuggable` line — this flag only appears when `android:debuggable="true"` is actually set; its absence confirms the release build is non-debuggable.
- `android/app/build.gradle`'s `release` build type has no `debuggable` override (Android's default for `release` is already `false`) and has `minifyEnabled true` / `shrinkResources true` (R8 shrinking + resource stripping both active).
- Synced `capacitor.config.json` (the config actually bundled into the app) points at `https://gohargeisa.com` with `cleartext: false` and no debug/staging overrides of any kind.

### Offline mode
- `public-mobile/offline.html` (the native-level fallback Capacitor shows when the initial remote load fails outright) confirmed present and correctly packaged: `unzip -l app-release.apk` shows `assets/public/offline.html` (6.5KB) and the now-fixed `assets/public/icon.png` (52KB, was 944KB).
- `capacitor.config.json`'s `server.errorPath: "offline.html"` confirmed intact in the synced/bundled config.
- The actual in-app offline experience (service worker, IndexedDB, offline banner, pull-to-refresh, reconnect sync) lives entirely in the website the WebView loads — already extensively code-reviewed and dev-server-tested in the two prior QA sessions; this rebuild only re-confirms the native-level fallback wiring around it is intact, since the native shell itself carries no offline logic of its own.

### Production configuration
- `capacitor.config.ts` / synced `capacitor.config.json`: production URL, `cleartext: false`, no `allowNavigation` wildcards beyond the two documented exceptions (Supabase, Google OAuth).
- `AndroidManifest.xml`: `INTERNET` + `POST_NOTIFICATIONS` permissions only; HTTPS deep-link intent-filter has `android:autoVerify="true"` targeting `gohargeisa.com`; no `usesCleartextTraffic` override.
- `android/variables.gradle`: `minSdkVersion 24`, `targetSdkVersion 36`, `compileSdkVersion 36` — current, not stale.

## Deployment confirmation

- Pushed to `origin/main`: `c115534..0e4431d`.
- Vercel production deployment confirmed **Ready** (`vercel ls`) within ~2 minutes of the push.
- Live-site spot check: `https://gohargeisa.com/icons/icon-192.png` now serves the exact byte-identical fixed asset (31,550 bytes, matching the local rebuild) — confirms the deploy actually took effect, not just that it reported success.
- Live-site spot check: `robots.txt` serves the `/*/business` disallow rule added in the prior QA pass — confirms that deploy (and everything before it) is also live, not just the newest commit.
- Core pages spot-checked live: `/en`, `/en/hotels`, `/en/events`, `/sitemap.xml` all return `200`.

## Final artifact paths

- **APK:** `C:\Projects\go-hargeisa\android\app\build\outputs\apk\release\app-release.apk` (2.47 MB)
- **AAB:** `C:\Projects\go-hargeisa\android\app\build\outputs\bundle\release\app-release.aab` (3.27 MB)

## What this rebuild does *not* cover

- No real Android device/emulator was available to install and run these binaries in this environment — signing, version, debug-flag, and packaged-asset checks were all done by inspecting the built artifacts directly (`apksigner`, `jarsigner`, `aapt`, `unzip`), not by launching the app. A real-device install/smoke-test is still worth doing before a Play Store upload, same caveat as every prior native build in this project.
- iOS was **not** rebuilt or version-bumped in this pass (this request was Android-only) — `ios/App/App.xcodeproj` still reports versionCode-equivalent `2` / `1.1.0` from the prior session. Worth bumping to `3` / `1.2.0` to match whenever iOS is next built, for consistency across stores.
- The Next.js/next-intl/`@supabase/ssr` security-upgrade item flagged in `FINAL_RELEASE_REPORT.md` is unrelated to this native rebuild and remains open.
