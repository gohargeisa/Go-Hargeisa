# Go Hargeisa — Release Checklist

Everything that can be prepared automatically already has been (see
`MOBILE_DEPLOYMENT.md`, `PLAY_STORE_READY.md`, and `PLAY_STORE_LISTING.md`
for the full detail behind each item below). **This file is only the
remaining manual steps** — things that genuinely require your own
decisions, accounts, or hardware.

---

## 🔴 Before you do anything else: the signing key decision

The AAB/APK were built and signed with a keystore generated automatically
this session (`android/release.jks`) purely to prove the build pipeline
works. **This is the one irreversible decision on this whole list.**

Pick one:

- [ ] **Generate your own keystore** (recommended):
  ```bash
  cd android
  keytool -genkeypair -v -keystore release.jks -alias gohargeisa -keyalg RSA -keysize 2048 -validity 10000
  ```
  Then edit `android/keystore.properties` with the new password (note:
  modern `keytool` uses one password for both store and key — see
  `MOBILE_DEPLOYMENT.md` §1 if you hit a signing error), and rebuild:
  ```bash
  ./gradlew bundleRelease assembleRelease
  ```
- [ ] **Or keep the auto-generated one** — copy both
  `android/release.jks` and `android/keystore.properties` to secure,
  backed-up storage (password manager + encrypted backup) **right now**.
  Neither file is in git. If you ever lose them, you can never publish an
  update to whatever Play Store listing you create with this key again.

## 🟢 Google Play Console

- [ ] Register a Play Console developer account ($25 one-time), if you
      don't have one
- [ ] Create the app listing, paste in the copy from `PLAY_STORE_LISTING.md`
      (title, short description, full description, release notes)
- [ ] Upload `store-assets/feature-graphic.png` and
      `store-assets/play-store-icon-512.png`
- [ ] **Take phone screenshots** (minimum 2, recommend 4–8) — needs a real
      device or emulator, neither available in this environment. Install
      the built APK to capture them:
      ```bash
      adb install android/app/build/outputs/apk/release/app-release.apk
      ```
- [ ] If supporting tablets, take 7″/10″ tablet screenshots too
- [ ] Set the privacy policy URL to `https://gohargeisa.com/en/privacy`
      (already live — content covers both the website and the app)
- [ ] Fill out the **Data Safety** form using the permissions/data table
      in `PLAY_STORE_READY.md`
- [ ] Fill out the **Content rating** questionnaire (IARC)
- [ ] Confirm **Target audience** is not primarily children
- [ ] Upload `android/app/build/outputs/bundle/release/app-release.aab`
      to a new release — **internal testing track first** is strongly
      recommended before a production rollout
- [ ] After the website is deployed with the real value below, verify App
      Links pass in Play Console (Release → App integrity → App signing,
      or test directly on a device — tapping a gohargeisa.com link should
      open the app, not a browser)

## 🌐 Website deploy (one small change needed)

- [ ] Get your release keystore's SHA-256 fingerprint:
      ```bash
      keytool -list -v -keystore android/release.jks -alias gohargeisa | grep SHA256
      ```
      (Skip this if you already have it — it's also printed in
      `PLAY_STORE_READY.md` for the auto-generated key, but re-run this if
      you generated your own per the signing-key decision above.)
- [ ] Paste it into `public/.well-known/assetlinks.json`, replacing
      `REPLACE_WITH_YOUR_RELEASE_KEYSTORE_SHA256_FINGERPRINT`
- [ ] Deploy the website so that file is live at
      `https://gohargeisa.com/.well-known/assetlinks.json` — this is what
      makes Android App Links (tap a link, open the app) actually verify

## 🍎 iOS (needs a Mac — cannot be done from this environment at all)

- [ ] On a Mac: `npx cap open ios`, sign in with your Apple ID / select
      your Team in Signing & Capabilities
- [ ] Get your Apple Team ID (Xcode → Account, or developer.apple.com →
      Membership), paste it into
      `public/.well-known/apple-app-site-association`, replacing
      `REPLACE_WITH_YOUR_APPLE_TEAM_ID`, and deploy the website
- [ ] Product → Archive, then upload via the Organizer window to App Store
      Connect
- [ ] Create the App Store Connect listing (same copy as Play, adapted to
      Apple's field limits — see `PLAY_STORE_LISTING.md`)
- [ ] Take iPhone + iPad screenshots per Apple's required device size
      classes
- [ ] Fill out the **App Privacy** questionnaire (same underlying data as
      Play's Data Safety form)
- [ ] Fill out the **Age rating** questionnaire
- [ ] Export compliance: answer "No" (standard HTTPS/TLS only, no
      proprietary encryption)
- [ ] For push notifications: create an APNs Auth Key in the Apple
      Developer portal, add it to your Firebase project, add
      `GoogleService-Info.plist` to the Xcode project (see
      `MOBILE_DEPLOYMENT.md` §2)

## 🔔 Push notifications (optional — only if you want them for v1)

- [ ] Create a Firebase project
- [ ] Android: add `google-services.json` to `android/app/` (already
      git-ignored, build.gradle already conditionally applies the plugin
      if present — no code change needed)
- [ ] iOS: add `GoogleService-Info.plist` via Xcode (see above)
- [ ] Wire `requestAndRegisterPushNotifications()` from
      `lib/mobile/push-notifications.ts` into wherever in the app first
      makes contextual sense (not on cold launch — see the comment in that
      file for why)
- [ ] Build a backend endpoint to store device tokens (the client-side
      code already calls a named stub, `sendTokenToServer()`, ready for
      this)

## ✅ Already done — nothing to do here

Everything else on the original list is complete and verified: both
native projects generated and configured, all icons/splash screens, the
offline screen, deep-link manifest/entitlements, safe-area fixes,
Privacy Policy and Terms of Service (live on the website now, in
English/Arabic/Somali), Play Store listing copy, feature graphic, a
real signed AAB and APK built and verified with `apksigner` — see
`PLAY_STORE_READY.md` for the full technical snapshot.
