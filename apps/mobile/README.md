# Go Hargeisa — native mobile app

The customer-facing Go Hargeisa app as a **real native React Native + Expo
(SDK 57)** application. This is *not* a WebView wrapper — it talks to the same
Supabase backend and an additive `/api/v1/*` read layer on the website, and
shares logic / types / i18n with the web app as plain TypeScript source (see
[`../../packages/README.md`](../../packages/README.md)).

The existing Capacitor app (`com.gohargeisa.app`) and the Next.js website stay
live and untouched until this app reaches feature parity.

## Status

Phase 1 — foundation. `apps/mobile/` scaffolding, navigation, theme, i18n+RTL,
Supabase/auth, secure storage, deep links, Android back, error/loading/offline
states. Screen bodies are placeholders until the P1d vertical slice.

## Prerequisites

- Node 20+, the repo bootstrapped at the root as usual
- For a device build: Android SDK + JDK 21 (Android Studio), or an Expo account for EAS

## Setup

```bash
cd apps/mobile
npm install                      # independent install — NOT hoisted to the repo root
cp .env.example .env.local       # fill in the PUBLIC Supabase url + anon key
```

## Scripts

| Command | What |
|---|---|
| `npm start` | Metro / dev server (needs a dev client — see below) |
| `npm run android` | build + run the debug dev client on a device/emulator |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `expo lint` |
| `npm run doctor` | `expo-doctor` |
| `npm run export:android` | JS-only bundle sanity check (`dist/`) |
| `npm test` | `jest` |
| `node scripts/generate-app-icons.mjs` | regenerate icons/splash from the web brand assets (run from repo root) |

## Dev client

There is no Expo Go support (native modules: MapLibre, secure-store, etc.).
Build the dev client once:

```bash
npx expo run:android          # local, or:
npx eas build --profile development --platform android
```

The dev build is `com.gohargeisa.app.dev` and installs alongside the live
Capacitor app. `com.gohargeisa.app` is reserved for the production profile,
used only at cutover.

## Architecture notes

- **Monorepo** — TS path-alias shared source, **no npm workspaces**. `apps/mobile`
  has its own `package.json` + lockfile; the repo root's `package.json` /
  `package-lock.json` / `vercel.json` are never touched.
- **metro.config.js** pins module resolution to `apps/mobile/node_modules`
  (`disableHierarchicalLookup: true`) so Metro never picks up the website's
  React 18. `expo-doctor` flags this — it is intentional.
- **Chrome is navy + blue.** Amber is for partner-branded surfaces only.
- **i18n** reuses `messages/{en,ar,so}.json` verbatim via `@gohargeisa/i18n`.
  Only `ar` is RTL. The Somaliland flag asset must never be Somalia's flag.
