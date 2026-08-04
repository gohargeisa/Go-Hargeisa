# Go Hargeisa — Mobile App Deployment Guide

This covers everything that needs a real Android SDK/Java toolchain or a Mac
with Xcode to finish — none of which is available in the environment that
prepared this app, so every step below is a manual action for whoever has
access to those tools. Everything that *could* be automated without them
(plugin config, icons/splash, manifest/Info.plist, signing-config scaffolding,
deep-link files, ProGuard rules) is already done and committed.

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

### Prerequisites (not available in the environment that prepared this repo)
- JDK 17+
- Android Studio (or just the command-line SDK tools + `ANDROID_HOME` set)

### Generate a release keystore (one-time, keep this file forever)
```bash
keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias gohargeisa
```
Move `release.jks` into `android/`. **Back it up somewhere safe outside git —
losing it means you can never publish an update to the same Play Store
listing again.**

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
Both were **not run** in this session — there is no Java/Android SDK
installed in the preparing environment. `minifyEnabled true` +
`shrinkResources true` are already on in the `release` build type
(`android/app/build.gradle`), with explicit Capacitor/Cordova keep rules in
`android/app/proguard-rules.pro` as a safety net — if a real device build
ever shows a blank WebView or a plugin silently not responding after this,
that ProGuard config is the first place to check.

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
automatically once a team is selected.

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
Store Connect. Not run in this session (needs Xcode on a Mac).

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
