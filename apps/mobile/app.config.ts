import type { ExpoConfig, ConfigContext } from "expo/config";

/**
 * Go Hargeisa — native customer-facing mobile app.
 *
 * Identity is environment-driven so the in-development build installs
 * ALONGSIDE the currently-shipped Capacitor app without collision:
 *   - APP_VARIANT=production → com.gohargeisa.app        (cutover only)
 *   - anything else (default) → com.gohargeisa.app.dev   (dev / preview)
 *
 * The production id / signing / Play upload is NOT exercised by this project
 * yet — the Capacitor app stays the live listing until native feature parity.
 */
const VARIANT = process.env.APP_VARIANT ?? "development";
const IS_PROD = VARIANT === "production";

const PACKAGE = IS_PROD ? "com.gohargeisa.app" : "com.gohargeisa.app.dev";
const NAME = IS_PROD ? "Go Hargeisa" : "Go Hargeisa (dev)";
const SCHEME = IS_PROD ? "gohargeisa" : "gohargeisa-dev";

// Brand navy — matches @gohargeisa/tokens brand.navyDeep and the web splash.
const NAVY_DEEP = "#051427";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: NAME,
  slug: "go-hargeisa",
  version: "0.1.0",
  orientation: "portrait",
  scheme: SCHEME,
  userInterfaceStyle: "automatic",
  icon: "./assets/images/icon.png",
  backgroundColor: NAVY_DEEP,
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: PACKAGE,
  },
  android: {
    package: PACKAGE,
    // Edge-to-edge is the SDK 57 default (react-native-edge-to-edge). We keep
    // predictive-back OFF so the app's own "press back again to exit" +
    // sheet/step interception (src/lib/back-handler.ts) stay authoritative.
    predictiveBackGestureEnabled: false,
    adaptiveIcon: {
      // The pin mark reads on a light ground; the OS masks the foreground so
      // it carries its own padding (see scripts/gen-icons in the P1b notes).
      backgroundColor: "#FFFFFF",
      foregroundImage: "./assets/images/android-icon-foreground.png",
    },
    // App Links for gohargeisa.com — verified only once
    // public/.well-known/assetlinks.json carries the Play app-signing
    // fingerprint (same outstanding item as the Capacitor app). The custom
    // scheme above works immediately.
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "https", host: "gohargeisa.com" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-localization",
    "expo-secure-store",
    "expo-web-browser",
    [
      "expo-splash-screen",
      {
        backgroundColor: NAVY_DEEP,
        image: "./assets/images/splash-icon.png",
        imageWidth: 180,
        resizeMode: "contain",
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Go Hargeisa uses your location to show how far businesses are from you and to centre the map.",
      },
    ],
    // MapLibre needs NO API key — tiles come from OpenFreeMap
    // (production-usable, keyless) via src/lib/maps.ts.
    "@maplibre/maplibre-react-native",
    [
      "expo-build-properties",
      {
        android: {
          // MapLibre native + edge-to-edge; SDK 57 default minSdk is already
          // 24 but pin it so a bare `expo prebuild` is reproducible.
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: { projectId: process.env.EAS_PROJECT_ID ?? "" },
    // Non-secret; read via src/env.ts.
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://gohargeisa.com",
    appVariant: VARIANT,
  },
});
