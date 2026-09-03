// Metro config — monorepo-aware + NativeWind.
//
// The mobile app lives at apps/mobile/ and consumes shared TypeScript source
// from ../../packages/* and ../../{types,lib/utils,messages} (the
// "TS path-alias shared source" mechanism — see ../../packages/README.md).
// Metro must WATCH the monorepo root so those source files are transformed
// and hot-reloaded, but must RESOLVE node_modules only from this app's own
// folder (react 19 here vs the website's react 18 at the repo root).
//
// tsconfig `paths` (@gohargeisa/*, the @/types override) are picked up
// automatically by @expo/metro-config.

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch the repo root so packages/*, types/, lib/utils/, messages/ are in scope.
config.watchFolders = [monorepoRoot];

// 2. Resolve modules ONLY from apps/mobile/node_modules — never the website's.
//    There are NO npm workspaces and nothing is hoisted, so the repo-root
//    node_modules holds the website's React 18 (+ Next). `disableHierarchical
//    Lookup: true` stops Metro walking up into it — a stray hierarchical
//    resolution of `react` there would break the RN 0.86 / React 19 app.
//    (expo-doctor flags this override; it is intentional for a
//    workspaces-free monorepo — see ../../packages/README.md.)
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: "./global.css" });
