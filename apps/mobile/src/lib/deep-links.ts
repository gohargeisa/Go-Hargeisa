/**
 * Deep-linking configuration for `expo-router`.
 *
 * Two URL surfaces map onto the SAME native routes:
 *   - custom scheme:  gohargeisa://  (dev: gohargeisa-dev://)
 *   - App Links:      https://gohargeisa.com/...   (autoVerify in app.config.ts)
 *
 * expo-router derives the path→screen map from the `src/app` tree
 * automatically; this file only declares the prefixes and the handful of
 * web paths whose shape differs from the native tree.
 */
import * as Linking from "expo-linking";

export const prefixes: string[] = [
  Linking.createURL("/"),
  "https://gohargeisa.com",
  "https://www.gohargeisa.com",
];

/**
 * expo-router derives the path→screen map from the `src/app` tree, so this
 * only needs the prefixes. Web paths whose shape differs from the native
 * tree (`/city-services/<slug>` → native partner detail, etc.) get explicit
 * routes in P1d when those screens exist.
 */
export const linking = { prefixes };

/** Strip a known web prefix so a pasted gohargeisa.com URL routes in-app. */
export function toInternalPath(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("gohargeisa.com")) {
      return `${u.pathname}${u.search}` || "/";
    }
    const parsed = Linking.parse(url);
    return parsed.path ? `/${parsed.path}` : "/";
  } catch {
    return "/";
  }
}
