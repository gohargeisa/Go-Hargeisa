/**
 * Deep-link normalization. Incoming links arrive from two surfaces:
 *   - the custom scheme (gohargeisa:// or gohargeisa-dev://)
 *   - App Links: https://gohargeisa.com/...   (autoVerify in app.config.ts)
 *
 * The website is locale-prefixed (`/en/…`, `/ar/…`, `/so/…`) and its URL
 * shapes don't all match the native route tree, so rewrite here:
 *   /<locale>/city-services/<slug>  -> /partner/<slug>
 *   /<locale>/city-services         -> /explore
 *   /<locale>/<anything-else>       -> /   (nearest safe landing)
 * Native-shaped paths (/partner, /category, /explore, /saved, /auth) pass
 * through. Always returns a clean, leading-slash path.
 */
import { isLocale } from "@gohargeisa/i18n";

const NATIVE_ROOTS = new Set(["partner", "category", "explore", "saved", "auth"]);

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    // Reduce any of {bare path, http(s) URL, custom-scheme URL} to pathname.
    let pathname = path;
    let query = "";
    if (/^https?:\/\//i.test(path)) {
      const u = new URL(path);
      pathname = u.pathname;
      query = u.search;
    } else {
      const schemeIdx = path.indexOf("://");
      if (schemeIdx >= 0) pathname = path.slice(schemeIdx + 3);
      const qIdx = pathname.search(/[?#]/);
      if (qIdx >= 0) {
        query = pathname.slice(qIdx).replace(/^#/, "?");
        pathname = pathname.slice(0, qIdx);
      }
    }

    const segments = pathname.split("/").filter(Boolean);

    if (segments[0] && NATIVE_ROOTS.has(segments[0])) {
      return `/${segments.join("/")}${query}`;
    }

    // Strip a leading locale segment (web URLs).
    const rest = segments[0] && isLocale(segments[0]) ? segments.slice(1) : segments;

    if (rest[0] === "city-services") {
      return rest[1] ? `/partner/${rest[1]}` : "/explore";
    }

    // Anything with no native screen yet lands on Home.
    return "/";
  } catch {
    return "/";
  }
}
