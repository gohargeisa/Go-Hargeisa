# Go Hargeisa — Building the iOS App Store Release

This project was prepared for App Store submission from a Windows machine,
which cannot run Xcode. Every configuration change that *could* be made
without Xcode has been made and verified (see "What was already done"
below); everything that requires Xcode itself — resolving Swift packages,
signing, archiving, exporting an `.ipa`, uploading — has to happen on a Mac.
This doc is the exact, no-guesswork walkthrough for that remaining part.

## Status snapshot

| | |
|---|---|
| App Name / Display Name | Go Hargeisa |
| Bundle Identifier | `com.gohargeisa.app` |
| Version / Build | `1.0.0` / `1` |
| Deployment target | iOS 15.0 |
| Dependency manager | Swift Package Manager (no CocoaPods, no `pod install`) |
| App icon | Single 1024×1024 source in `AppIcon.appiconset` — Xcode 14+ generates every device size from it at build time |
| Launch screen | `LaunchScreen.storyboard` → `Splash.imageset` (2732×2732 universal, navy `#051427` background matching the web splash) |
| Permissions declared | Location (When In Use), Camera, Photo Library — all justified by real features (nearby-distance sorting, review photo upload) |
| ATS | Default-secure, no exceptions (`NSAllowsArbitraryLoads: false`) — every endpoint (`gohargeisa.com`, `*.supabase.co`, `accounts.google.com`) is HTTPS |
| Privacy manifest | `App/PrivacyInfo.xcprivacy` present, declares UserDefaults + file-timestamp API usage and the data types the app actually collects |
| Export compliance | Pre-answered in `Info.plist` (`ITSAppUsesNonExemptEncryption: false`) — standard HTTPS only, no custom crypto |

## Step 0 — a known Windows-only bug, already fixed once

The Capacitor CLI, when it generates/updates `ios/App/CapApp-SPM/Package.swift`
on Windows, writes native Windows path separators (backslash) into the Swift
source, e.g. `path: "..\..\..\node_modules\@capacitor\app"`. Backslash is a
Swift string escape character, and `\.`/`\@` aren't valid escapes — so the
file fails to parse and Xcode can't resolve the local package at all. This
was hit and fixed during this prep pass (converted to forward slashes).

**This will happen again** if `npx cap sync ios` is ever re-run from a
Windows machine. If that happens before you get to a Mac: open
`ios/App/CapApp-SPM/Package.swift` and replace every backslash in a `path:`
argument with a forward slash before opening the project in Xcode. Running
`cap sync` from macOS or Linux does not have this problem — paths come out
correct.

## 1. Prerequisites

- A Mac with Xcode 15 or later.
- An active Apple Developer Program membership ($99/yr) — required for
  device testing, push notifications, TestFlight, and App Store submission.
- Node.js, to re-run `npx cap sync` / `npm run mobile:assets` if you change
  anything before building.

## 2. Get the repo onto the Mac

```bash
git clone <your remote> go-hargeisa && cd go-hargeisa
npm install
```

## 3. Open the project

```bash
npx cap open ios
```

or open `ios/App/App.xcodeproj` directly in Xcode. There is **no**
`.xcworkspace` — this project uses Capacitor's Swift Package Manager
integration, not CocoaPods, so the `.xcodeproj` is the correct (and only)
file to open. On first open, Xcode resolves the local `CapApp-SPM` package
and the upstream `capacitor-swift-pm` package automatically — this needs
network access once and can take a minute or two.

## 4. Set your signing team

Project navigator → **App** project → **App** target → **Signing &
Capabilities** tab → set **Team** to your Apple Developer account.
`CODE_SIGN_STYLE` is already `Automatic`, so Xcode creates/selects the right
provisioning profile as soon as a team is chosen. `DEVELOPMENT_TEAM` is
deliberately left blank in the project file — it's account-specific and
can't be set outside Xcode.

## 5. Push Notifications capability

`ios/App/App/App.entitlements` already declares `aps-environment`
(currently `development`) and Associated Domains
(`applinks:gohargeisa.com`). Still needed in Xcode:

- Signing & Capabilities → **+ Capability** → **Push Notifications**.
  Re-adding it here — even though the entitlement key already exists in the
  file — is what registers the capability against your provisioning
  profile; without this step Apple won't issue a distribution profile that
  supports push.
- Both Debug and Release share a single entitlements file, so
  `aps-environment` stays `development` even in a Release archive built as-is.
  If push needs to actually work in the shipped App Store build, switch
  this value to `production` (Capabilities UI, or edit `App.entitlements`
  directly) before archiving for TestFlight/App Store, then switch back to
  `development` for local debug builds.

## 6. Spot-check app identity

General tab should already show (all set by this prep pass, in
`project.pbxproj` / `Info.plist` — nothing to change unless you're bumping
the version for a new submission, see §11):

- Bundle Identifier: `com.gohargeisa.app`
- Version: `1.0.0`
- Build: `1`
- Display Name: `Go Hargeisa`

## 7. Select a build destination

Top toolbar device dropdown → **Any iOS Device (arm64)**. Archiving is
disabled while a Simulator destination is selected.

## 8. Archive

**Product** menu → **Archive**. Xcode builds in the Release configuration
and opens the **Organizer** window when it finishes. On the very first
archive, expect Xcode to also resolve/build both Swift packages, which adds
a few minutes.

## 9. Export or upload the IPA

In Organizer, with the new archive selected → **Distribute App**:

- **App Store Connect → Upload** — sends the build straight to App Store
  Connect for TestFlight/review; no local `.ipa` file. This is the normal
  path for a store release.
- **App Store Connect → Export** — same signing, but saves a local `.ipa`
  you can keep or hand off instead of (or before) uploading. Organizer
  prompts for a save location; the exported folder contains `App.ipa`.
- **Ad Hoc** / **Development**, if you just need an `.ipa` for direct
  device install/testing rather than App Store submission.

Xcode re-validates signing, entitlements, and `Info.plist` contents at this
step — it's the closest thing to a "the build is sound" confirmation
available before actual App Store review.

## 10. App Store Connect listing

Before or while the uploaded build processes:

1. https://appstoreconnect.apple.com → **My Apps** → **+** → **New App**.
2. Platform iOS, Bundle ID `com.gohargeisa.app` (must exist under
   **Identifiers** at developer.apple.com first — Xcode's automatic signing
   creates it the first time you archive/build with a team selected, or
   create it there manually).
3. Fill in name/subtitle/description/keywords, screenshots per required
   device size class, privacy policy URL, App Privacy questionnaire (§11
   below), age rating.
4. Once the uploaded build finishes processing (usually 15–60 minutes,
   email notification), attach it to a version and submit for review.

## 11. App Privacy questionnaire — answers matching what's declared in-app

`PrivacyInfo.xcprivacy` and `Info.plist` already declare the following;
answer App Store Connect's questionnaire consistently with them:

- **Location** (approximate/precise, When In Use only) — used to show
  distance to nearby hotels/restaurants/services; not linked to identity,
  not used for tracking.
- **Photos** — used only when a user chooses to attach a photo to a review;
  linked to their account, not used for tracking.
- **Email / account info** — via Supabase auth (email+password or Google
  OAuth), used for account functionality only, not for tracking.
- No third-party ad SDKs, no tracking domains (`NSPrivacyTrackingDomains`
  is empty, `NSPrivacyTracking` is `false`).

> Note on App Review: this app is a Capacitor **remote-URL shell** — it
> loads `https://gohargeisa.com` directly rather than bundling a static
> export (see the architecture comment at the top of
> `capacitor.config.ts`). Apple's Guideline 4.2 ("Minimum Functionality")
> occasionally flags apps that read as "just a website in a WebView." This
> app clears that bar via native integration (push notifications, native
> splash/status bar, deep links, haptics, share sheet, native camera/photo
> picker for reviews) — worth having those working end-to-end before
> submitting, since reviewers may test them.

## 12. Before every future resubmission

- Bump `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` in
  `ios/App/App.xcodeproj/project.pbxproj` (both the Debug and Release
  blocks under the **App** target — four lines total). Apple rejects a
  build whose version+build number was already used.
- If `public/icons/icon-512.png` or the splash source photo changed:
  `npm run mobile:assets && npx cap sync ios` (re-check §0 if run on
  Windows).
- Re-run §7–§9.

---

See `../MOBILE_DEPLOYMENT.md` for the equivalent Android release process and
the shared "before every release" checklist covering both platforms.
