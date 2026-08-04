# Go Hargeisa — Google Play Readiness Snapshot

Generated from the actual built artifacts (`aapt2 dump badging` +
`apksigner verify`), not from source inspection — this reflects what's
really inside the files below as of the last build.

## Release files

| File | Path | Size |
|---|---|---|
| Android App Bundle (upload this to Play Console) | `android/app/build/outputs/bundle/release/app-release.aab` | 4.1 MB (4,098,783 bytes) |
| Release APK (for direct/sideload testing only — Play Console wants the AAB) | `android/app/build/outputs/apk/release/app-release.apk` | 3.3 MB (3,319,262 bytes) |

Neither file is committed to git (`android/.gitignore` excludes `*.aab`/
`*.apk`) — rebuild with `./gradlew bundleRelease` / `./gradlew assembleRelease`
from `android/` (needs `JAVA_HOME` set — see `MOBILE_DEPLOYMENT.md`).

## Package identity

| Field | Value |
|---|---|
| Package name (application ID) | `com.gohargeisa.app` |
| Version name | `1.0.0` |
| Version code | `1` |
| Min SDK | 24 (Android 7.0) |
| Target SDK | 36 |
| Compile SDK | 36 |

**Version code must strictly increase on every future Play Console upload** —
bump it in `android/app/build.gradle` (`defaultConfig.versionCode`) before
building the next release.

## Permissions used

Confirmed from the built APK's merged manifest (`aapt2 dump badging`), not
just `AndroidManifest.xml` — this is the full, real list including what
each plugin auto-merged in:

| Permission | Source | Why |
|---|---|---|
| `android.permission.INTERNET` | Declared in `AndroidManifest.xml` | Required for any WebView-based app to load content at all |
| `android.permission.POST_NOTIFICATIONS` | Declared in `AndroidManifest.xml` | Android 13+ runtime permission push notifications need to display |
| `android.permission.VIBRATE` | Auto-merged from `@capacitor/haptics` | Haptic feedback |
| `android.permission.ACCESS_NETWORK_STATE` | Auto-merged from `@capacitor/network` | Connectivity detection (drives the offline-screen auto-retry) |
| `android.permission.WAKE_LOCK` | Auto-merged from `@capacitor/push-notifications` | FCM message delivery |
| `com.google.android.c2dm.permission.RECEIVE` | Auto-merged from `@capacitor/push-notifications` | FCM message delivery |
| `com.gohargeisa.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | Auto-merged (Android 13+ FCM requirement) | Self-scoped, not user-facing |

**Nothing beyond this.** No camera, microphone, location, contacts,
storage, or SMS permissions — the codebase was specifically audited for
`navigator.geolocation`/`getUserMedia` usage and has none; photo uploads
(reviews, listing galleries) go through a plain `<input type="file">`,
which iOS/Android's own WebView file-picker handles without the host app
declaring a permission.

This is the exact list to expect in Play Console's auto-generated
permissions declaration — no surprises should show up there.

## Signing status

⚠️ **Signed with a locally-generated, non-production keystore — replace
before real submission (or explicitly decide to keep it).**

| Field | Value |
|---|---|
| Keystore file | `android/release.jks` (git-ignored, not committed) |
| Key alias | `gohargeisa` |
| Certificate DN | `CN=Go Hargeisa, OU=Mobile, O=Go Hargeisa, L=Hargeisa, ST=Woqooyi Galbeed, C=SO` |
| Certificate SHA-256 | `E3:E3:20:48:08:84:2E:06:D8:BC:E5:38:B6:ED:DE:86:6B:40:F7:C2:37:4E:AB:39:B1:BF:CE:69:8D:99:60:D5` |
| Certificate SHA-1 | `F8:28:46:B9:6F:95:29:EA:56:B1:A4:5F:3F:57:5E:FF:E1:FD:44:71` |
| `apksigner verify` | ✅ Exit code 0 — signature is cryptographically valid |

This keystore was generated in a prior session purely to prove the signing
pipeline works end-to-end. Its passwords were randomly generated, shown
once, and are **not** stored anywhere else. **Before uploading to Play
Console, do one of:**
1. **Generate your own keystore** (recommended — see `MOBILE_DEPLOYMENT.md`
   §1) and rebuild, or
2. **Keep this one**, but immediately copy `android/release.jks` +
   `android/keystore.properties` to secure, permanent, backed-up storage
   *right now* — if this working directory is ever lost, so is the only
   copy, and you can never update this Play Store listing again.

If you keep this keystore, put its SHA-256 fingerprint above into
`public/.well-known/assetlinks.json` (replacing the placeholder) and deploy
the website, so Android App Links verification passes.

## Build status

| Check | Result |
|---|---|
| `./gradlew assembleDebug` | ✅ BUILD SUCCESSFUL |
| `./gradlew bundleRelease` | ✅ BUILD SUCCESSFUL — signed AAB produced |
| `./gradlew assembleRelease` | ✅ BUILD SUCCESSFUL — signed APK produced |
| R8 minification (`minifyEnabled true`) | ✅ Completed without error against the real plugin set (confirms the keep rules in `android/app/proguard-rules.pro` are sufficient) |
| Resource shrinking (`shrinkResources true`) | ✅ Completed without error |
| `apksigner verify` | ✅ Exit code 0 |
| `npx tsc --noEmit` / `npm run lint` / `npm run build` (web app) | ✅ Clean |
| Real device/emulator install-and-run test | ❌ Not done — no Android emulator or physical device available in this environment |

## Everything else needed before uploading to Google Play

- [ ] **Decide on the signing key** (see Signing status above) — this is the
      one irreversible item on this list
- [ ] **Play Console account** — $25 one-time registration fee if not
      already set up
- [ ] **App listing**: title, short description (80 chars), full
      description (4000 chars), category (Travel & Local fits)
- [ ] **Graphic assets**:
  - App icon 512×512 — source available at `public/icons/icon-512.png`
    (already used to generate all in-app icons)
  - Feature graphic 1024×500 — not yet created
  - Phone screenshots (min 2, recommend 4-8) — not yet captured, needs a
    real device/emulator run
  - 7" and 10" tablet screenshots if supporting tablets (the app is
    responsive, so likely yes) — not yet captured
- [ ] **Privacy policy URL** — must be publicly hosted (e.g.
      `gohargeisa.com/privacy` — check whether `app/[locale]/privacy/page.tsx`
      already covers this or needs updating for mobile-specific data
      handling)
- [ ] **Data safety form** — declares what user data the app collects/
      shares. Based on the actual features (Supabase auth via email or
      Google OAuth, bookings, reviews, favorites): collects account email/
      name, and user-generated content (reviews, booking details) tied to
      that account. No location, no contacts, no camera/microphone/photo
      data collected by the app itself (only whatever the user explicitly
      uploads via the file picker).
- [ ] **Content rating questionnaire** — IARC questionnaire in Play
      Console; a travel-guide/booking app should rate as "Everyone" or
      close to it
- [ ] **Target audience & content settings** — confirm not primarily
      directed at children (it isn't)
- [ ] **App Links verification** — `public/.well-known/assetlinks.json`
      needs the real signing fingerprint (see Signing status above) live on
      the production site before Android will auto-verify deep links
- [ ] **Upload the AAB** (`app-release.aab` above) to a new release in Play
      Console — internal testing track first is recommended before
      production rollout
