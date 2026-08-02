"use server";

import { parseGoogleMapsUrl } from "@/lib/utils/google-maps";
import type { Coordinates } from "@/types";

const SHORT_LINK_HOSTS = ["goo.gl", "maps.app.goo.gl"];

function isShortLink(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return SHORT_LINK_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

/**
 * Resolves a pasted Google Maps link (long-form or short) to coordinates.
 * Long-form URLs are parsed with plain string matching (parseGoogleMapsUrl,
 * no network needed). Short links (maps.app.goo.gl/goo.gl) redirect to the
 * long form server-side — that redirect can't be followed from the browser
 * (cross-origin), so this has to be a server action.
 */
export async function resolveGoogleMapsUrl(url: string): Promise<Coordinates | null> {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const direct = parseGoogleMapsUrl(trimmed);
  if (direct) return direct;

  if (!isShortLink(trimmed)) return null;

  try {
    const response = await fetch(trimmed, { method: "GET", redirect: "follow" });
    // Google's short links sometimes land on an interstitial page whose
    // *body* contains the real long URL rather than redirecting via
    // Location headers alone — check both the final resolved URL and a
    // couple of well-known meta-refresh/canonical patterns in the HTML.
    const resolved = parseGoogleMapsUrl(response.url);
    if (resolved) return resolved;

    const html = await response.text();
    const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/i);
    if (canonicalMatch) {
      const fromCanonical = parseGoogleMapsUrl(decodeURIComponent(canonicalMatch[1]));
      if (fromCanonical) return fromCanonical;
    }
    return parseGoogleMapsUrl(html);
  } catch {
    return null;
  }
}
