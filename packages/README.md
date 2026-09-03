# `packages/*` — shared source for web + native mobile

Isomorphic TypeScript shared between the existing Next.js website (repo root)
and the native app (`apps/mobile/`, React Native + Expo).

## Mechanism: TS path-alias shared source — **not** npm workspaces

The repo root `package.json` has **no `workspaces` key** and is **never
modified** by the mobile project. If it were a workspace, a Vercel `npm
install` for the website would also resolve `apps/mobile`'s React Native /
MapLibre / Reanimated native packages (postinstall scripts, slower and
riskier web deploys). Instead:

- These packages are plain `.ts` source folders. They are **never
  `npm install`ed** at the repo root.
- Consumers wire them via `tsconfig` path aliases + (for the mobile app)
  Metro `watchFolders`:
  - `tsconfig.base.json` (repo root) defines `@gohargeisa/*` → `packages/*/src`.
  - `apps/mobile/tsconfig.json` extends it; `apps/mobile/metro.config.js`
    adds the repo root to `watchFolders`.
  - The website only starts importing `@gohargeisa/*` in its `app/api/v1/*`
    layer (P1c) and gets the aliases added to its own `tsconfig.json` then.
- Cross-package imports inside `packages/*` use **relative paths**
  (`../../types/src`), never the `@gohargeisa/*` alias, so the web `tsc`
  (which globs `packages/**/*.ts` via its `include`) resolves them with no
  extra config.

## Isomorphism guard

`packages/{core,i18n,tokens,types}` each carry an ESLint config that bans
`next/*`, `react`, `react-dom`, `react-native`, `fs`, `path`, and
`@/lib/data/*` imports. They must stay runnable in both a Next.js server and
a React Native runtime.

## The packages

| Package | Contents | Source of truth |
|---|---|---|
| `@gohargeisa/types` | Domain + Supabase `Database` types | re-exports the web app's `types/` |
| `@gohargeisa/core` | Pure logic: URL builders (WhatsApp, Google Maps), opening-hours status, geo distance, price/rating formatting, search sanitisation, post-login routing | re-exports the web app's pure `lib/utils/*` |
| `@gohargeisa/i18n` | Locale list, `localeConfig` (dir map), and the `en/ar/so` message resources | re-exports `lib/i18n/config.ts` + `messages/*.json` |
| `@gohargeisa/tokens` | Colours (navy/blue brand chrome, amber = partner-only), radii, shadows, spacing as plain JS objects | mirrors `tailwind.config.ts` |
| `@gohargeisa/api` | Typed `fetch` client for `/api/v1/*` (added in P1c) | — |
