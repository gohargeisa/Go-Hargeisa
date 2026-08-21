import type { Coordinates } from "@/types";

/**
 * No API key, no paid service — the single "Open in Google Maps" action
 * across the app (Directions was removed sitewide in favor of this one
 * consistent action, see components/shared/location-map-section.tsx) is a
 * plain link out to Google Maps, built from this one shared helper so the
 * URL shape (and the "prefer a saved link over a built one" rule) never
 * drifts between hotels/restaurants/cafes/attractions/city services.
 */

export function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** A business's own saved Google Maps link (e.g. city_services.maps_url)
 * is preferred over one generated from coordinates — a curated link can
 * point at a specific Place/entrance a bare lat/lng search can't. */
export function resolveMapsUrl(coords: Coordinates | null | undefined, savedUrl?: string | null): string | undefined {
  if (savedUrl) return savedUrl;
  if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
    return buildGoogleMapsUrl(coords.lat, coords.lng);
  }
  return undefined;
}

/**
 * Extracts {lat, lng} from a pasted Google Maps URL — the admin location
 * picker's "paste a link instead of dropping a pin on a map" shortcut.
 * Handles the URL shapes Google Maps actually produces (.../@lat,lng,zoomz,
 * ?q=lat,lng, ?query=lat,lng, &destination=lat,lng) plus a bare
 * "lat,lng" pasted directly. Returns null if no coordinate pair is found —
 * callers should fall back to the plain numeric inputs in that case.
 */
export function parseGoogleMapsUrl(url: string): Coordinates | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const atMatch = trimmed.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

  const paramMatch = trimmed.match(/[?&](?:q|query|destination)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (paramMatch) return { lat: parseFloat(paramMatch[1]), lng: parseFloat(paramMatch[2]) };

  const bareMatch = trimmed.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
  if (bareMatch) return { lat: parseFloat(bareMatch[1]), lng: parseFloat(bareMatch[2]) };

  return null;
}
