# Go Hargeisa — Mobile App Deployment Guide

**Update:** Android Studio and a full Android SDK (platform 36, build-tools
36.0.0) turned out to already be installed on this machine (just not on
`PATH`), along with Android Studio's own bundled JDK 21 (`jbr/`). Using
those, this repo now has a **verified, real Gradle build**: a signed release
AAB and APK were both built and their signatures verified with `apksigner`
— see §1a for exactly what that means and what you still need to do before
a real Play Store submission. iOS still needs a Mac with Xcode — nothing in
this environment can substitute for that (§2 unchanged).

## Architecture recap

The app is a **remote-URL Capacitor shell** — `capacitor.config.ts`'s
`server.url` points at `https://gohargeisa.com`, the live production site.
The native project does **not** bundle a static export of the Next.js app
(it can't — Server Components, Server Actions, and cookie-based auth don't
survive `next export`). `webDir` (`public-mobile/`) only holds the small
offline fallback page shown when the device can't reach the internet.

This means: **every code change to the website ships to the app instantly**,
with zero app-store review needed — you only need to resubmit a new
Android/iOS build when something in *this* list changes (icons, permissions,
native plugins, deep-link config, the app's own version number).

---

## 1. Android — signed release AAB/APK

### 1a. What already happened in this session — read this first

A **locally-generated, non-production keystore** (`android/release.jks`,
git-ignored, never committed) was created purely to prove the whole release
pipeline actually compiles, signs, and shrinks correctly — something no
amount of source-reading could confirm on its own. With it:

```
./gradlew bundleRelease   → android/app/build/outputs/bundle/release/app-release.aab   (4.1 MB)
./gradlew assembleRelease → android/app/build/outputs/apk/release/app-release.apk      (3.3 MB)
```

Both built with `minifyEnabled true` + `shrinkResources true` (R8) with no
errors, and both signatures were independently verified:
```
apksigner verify app-release.apk   → exit code 0, no errors
```
`aapt2 dump badging` on the built APK also confirmed the manifest merged
correctly — package `com.gohargeisa.app`, versionName `1.0.0`, minSdk 24,
targetSdk 36, and every plugin's own required permission
(`VIBRATE`/haptics, `ACCESS_NETWORK_STATE`/network,
`WAKE_LOCK`+`c2dm.permission.RECEIVE`/push) auto-merged in alongside the two
explicitly declared in `AndroidManifest.xml` — nothing extraneous.

**This proves the build works. It does not mean you can publish this exact
AAB.** `android/release.jks` was generated with random passwords this
session never displays or stores anywhere else, isn't backed up, and isn't
tied to your identity — losing access to this machine loses the key. Before
any real Play Store upload, do one of:
- **(recommended) Generate your own keystore** — the whole point of a
  release key is that only you hold it. Follow the steps below exactly as
  if §1a never happened; overwrite `android/release.jks` and
  `android/keystore.properties`.
- **Or keep this session's key** — if you do, immediately copy
  `android/release.jks` and `android/keystore.properties` out of this
  machine to secure permanent storage (password manager + encrypted
  backup) right now, before anything deletes this working directory.

### Prerequisites
Already satisfied on this machine: JDK 21 at
`C:\Program Files\Android\Android Studio\jbr`, Android SDK at
`C:\Users\YASEEN\AppData\Local\Android\Sdk` (platform 36, build-tools
36.0.0), both wired via `android/local.properties` (git-ignored,
machine-specific — regenerate on any other machine with
`echo sdk.dir=/path/to/Sdk > android/local.properties`). On a machine
without Android Studio pre-installed: JDK 17+ and the Android SDK
command-line tools are the only two prerequisites.

### Generate your own release keystore (one-time, keep this file forever)
```bash
keytool -genkeypair -v -keystore release.jks -alias gohargeisa -keyalg RSA -keysize 2048 -validity 10000
```
Move `release.jks` into `android/`. **Back it up somewhere safe outside git —
losing it means you can never publish an update to the same Play Store
listing again.** (Note: modern `keytool` defaults to a PKCS12 keystore,
which only supports one password for both the store and the key — if you
pass `-storepass`/`-keypass` with different values, `keytool` silently
ignores `-keypass` and uses the store password for both; make sure
`android/keystore.properties`'s `keyPassword` matches `storePassword`
exactly, or Gradle's signing step will fail with a wrong-password error.)

### Wire up signing
```bash
cp android/keystore.properties.example android/keystore.properties
# edit android/keystore.properties with the real storePassword/keyPassword
# you just set, and confirm storeFile=release.jks
```
`keystore.properties` and `*.jks` are already git-ignored
(`android/.gitignore`). `android/app/build.gradle` picks this file up
automatically if present — no further gradle changes needed.

### Build
```bash
cd android
./gradlew bundleRelease   # produces app/build/outputs/bundle/release/app-release.aab
./gradlew assembleRelease # produces app/build/outputs/apk/release/app-release.apk (for direct/sideload testing)
```
Both commands are verified working (see §1a — that's exactly what produced
the AAB/APK sizes quoted there, just with your own keystore instead of the
session's temporary one). `minifyEnabled true` + `shrinkResources true` are
on in the `release` build type (`android/app/build.gradle`), with explicit
Capacitor/Cordova keep rules in `android/app/proguard-rules.pro` — R8
shrinking already completed successfully against the real plugin set this
app ships, so the keep rules are confirmed sufficient at build time. Runtime
behavior on a real device still hasn't been checked (no emulator/device
available in this environment) — if a real device build ever shows a blank
WebView or a plugin silently not responding, that ProGuard config is the
first place to check.

### Install and try it (optional, before a real Play Store upload)
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```
Needs a device connected via USB debugging, or an emulator running
(`C:\Users\<you>\AppData\Local\Android\Sdk\platform-tools\adb.exe` if not
on `PATH`).

### App Links (verified universal links)
1. Get your release keystore's SHA-256 fingerprint:
   ```bash
   keytool -list -v -keystore release.jks -alias gohargeisa | grep SHA256
   ```
2. Put it into `public/.well-known/assetlinks.json` (replace
   `REPLACE_WITH_YOUR_RELEASE_KEYSTORE_SHA256_FINGERPRINT`) and deploy the
   website — that file must be live at
   `https://gohargeisa.com/.well-known/assetlinks.json` before Android will
   verify the `autoVerify="true"` intent-filter already in
   `AndroidManifest.xml`.

### Push notifications (Firebase)
1. Create a Firebase project, add an Android app with package name
   `com.gohargeisa.app`.
2. Download `google-services.json`, place it at `android/app/google-services.json`
   (already git-ignored). `android/app/build.gradle` already conditionally
   applies the `google-services` plugin only if this file exists — no other
   change needed.
3. `lib/mobile/push-notifications.ts` has the registration/token-listener
   code ready; call `requestAndRegisterPushNotifications()` from wherever in
   the app makes sense contextually (not on cold launch — see the comment in
   that file), and fill in `sendTokenToServer()` once a backend endpoint to
   store device tokens exists.

---

## 2. iOS — Xcode / App Store submission

**Full step-by-step IPA build walkthrough: [`ios/README.md`](ios/README.md).**
That doc is the source of truth for the archive/export/upload steps; this
section is a shorter recap plus what changed in the most recent iOS prep
pass.

The project has since been fully configured for a first App Store
submission: app name/display name "Go Hargeisa", bundle ID
`com.gohargeisa.app`, version `1.0.0` build `1`, Camera/Photo
Library/Location Info.plist usage strings (justified by the review-photo
upload and nearby-distance features), explicit ATS with no exceptions
(everything is HTTPS), a `PrivacyInfo.xcprivacy` manifest, and
`ITSAppUsesNonExemptEncryption: false` pre-answered. None of that needs to
be redone — see `ios/README.md`'s status table for the full list.

One Windows-specific bug was found and fixed during that pass: `npx cap
sync ios` run on Windows writes backslash path separators into
`ios/App/CapApp-SPM/Package.swift`, which is invalid Swift syntax and
breaks package resolution in Xcode. Already fixed once; **if `cap sync` is
ever re-run from Windows again, re-check that file** (`ios/README.md` §0
has the fix). Running `cap sync` from macOS/Linux doesn't have this
problem.

### Prerequisites (not available in the environment that prepared this repo — Windows)
- A Mac with Xcode 15+
- An active Apple Developer Program membership ($99/yr) for real device
  testing, push notifications, and App Store submission

### Open the project
```bash
npx cap open ios
```
This project uses Capacitor's **Swift Package Manager** integration (no
CocoaPods/`pod install` needed — `ios/App/CapApp-SPM/Package.swift` already
lists all 10 installed plugins). Xcode resolves SPM packages automatically
on first open.

### Code signing
In Xcode: select the **App** target → **Signing & Capabilities** → set your
Team. `CODE_SIGN_STYLE = Automatic` is already set
(`ios/App/App.xcodeproj/project.pbxproj`), so Xcode will provision
automatically once a team is selected. `DEVELOPMENT_TEAM` is deliberately
left blank in the project file — it's account-specific and can only be set
from within Xcode.

### Universal Links
1. `ios/App/App/App.entitlements` already declares
   `applinks:gohargeisa.com` and is already wired into both build
   configurations via `CODE_SIGN_ENTITLEMENTS`.
2. Get your Apple Team ID (Xcode → Account, or developer.apple.com →
   Membership).
3. Put it into `public/.well-known/apple-app-site-association` (replace
   `REPLACE_WITH_YOUR_APPLE_TEAM_ID`) and deploy the website — that file
   must be live at `https://gohargeisa.com/.well-known/apple-app-site-association`
   (served as `application/json` — `next.config.mjs` already forces the
   right content-type despite the extensionless filename).

### App icon / splash
Already generated (`ios/App/App/Assets.xcassets/AppIcon.appiconset`,
`.../Splash.imageset`) from `public/icons/icon-512.png` via
`npm run mobile:assets`. Re-run that script and `npx cap sync` if the brand
mark ever changes.

### Push notifications (APNs)
1. In the Apple Developer portal, create an APNs Auth Key (recommended over
   per-app certificates — one key works for every app).
2. In Xcode: Signing & Capabilities → **+ Capability** → **Push
   Notifications**, and also add **Background Modes** → **Remote
   notifications** if you want silent/background pushes.
3. Add the APNs key to your Firebase project (if using Firebase Cloud
   Messaging as the cross-platform send layer — recommended, since
   `lib/mobile/push-notifications.ts` already targets
   `@capacitor/push-notifications`, which is FCM/APNs-agnostic on the client
   side) via Firebase Console → Project Settings → Cloud Messaging → APNs
   Authentication Key.
4. Add `GoogleService-Info.plist` to `ios/App/App/` via Xcode (drag into the
   project navigator, ensure "Copy items if needed" + target membership is
   checked) — not scripted here since it must go through Xcode's own asset
   pipeline to be included in the build correctly.

### Build & Archive
Xcode → Product → Archive, then use the Organizer window to upload to App
Store Connect. Not run in this session (needs Xcode on a Mac) — see
[`ios/README.md`](ios/README.md) for the full step-by-step (destination
selection, archive, export/upload, App Store Connect listing, App Privacy
questionnaire answers).

---

## 3. Both platforms — before every release

```bash
npm run mobile:assets   # regenerate icons/splash if the brand mark changed
npm run build            # verify the website itself builds clean
npx cap sync              # push config + plugin changes into both native projects
```
Bump the version before building:
- Android: `android/app/build.gradle` → `versionCode` (must strictly
  increase every Play Console upload) and `versionName`.
- iOS: `ios/App/App.xcodeproj/project.pbxproj` → `CURRENT_PROJECT_VERSION`
  and `MARKETING_VERSION` (both Debug and Release blocks).

---

## 4. Store listing checklist

Neither store submission was done in this session (both require the
respective developer account, which this environment has no access to).

**Google Play Console**
- [ ] Signed AAB uploaded (see §1)
- [ ] Store listing: title, short/full description, screenshots (phone +
      tablet), feature graphic, app icon (512×512, already have the source
      at `public/icons/icon-512.png`)
- [ ] Privacy policy URL
- [ ] Data safety form (this app collects: account email/name via Google
      OAuth or email signup, and booking/review content tied to that
      account — declare accordingly)
- [ ] Content rating questionnaire
- [ ] Target audience & content settings

**Apple App Store Connect**
- [ ] Signed build uploaded via Xcode Organizer (see §2)
- [ ] App Store listing: name, subtitle, description, keywords, screenshots
      per required device size class, app icon (1024×1024, already
      generated at `ios/App/App/Assets.xcassets/AppIcon.appiconset`)
- [ ] Privacy policy URL
- [ ] App Privacy (data collection) questionnaire — same underlying data as
      the Play Data Safety form above
- [ ] Age rating questionnaire
- [ ] Export compliance (standard HTTPS/TLS only — answer "No" to using
      proprietary encryption)
