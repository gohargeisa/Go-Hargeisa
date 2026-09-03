/**
 * Maps + location helpers.
 *
 * P1 uses MapLibre GL Native with OpenFreeMap's hosted vector tiles — free,
 * keyless, production-usable (https://openfreemap.org). No Google Maps SDK,
 * no billing. "Open in Google Maps" / "Get directions" is an *external*
 * handoff via `Linking.openURL` — it opens the user's own maps app.
 */
import { Linking, Platform } from "react-native";

import { buildGoogleMapsUrl } from "@gohargeisa/core";

/** OpenFreeMap style JSON. `liberty` is the general-purpose light style. */
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

/** Hargeisa city centre — default camera when the user hasn't shared location. */
export const HARGEISA_CENTER = {
  latitude: 9.5624,
  longitude: 44.077,
} as const;

export const DEFAULT_ZOOM = 12;

type LatLng = { latitude: number; longitude: number };

/** Open the platform maps app at a coordinate. Falls back to the Google Maps
 *  web URL (shared web/native implementation from `@gohargeisa/core`). */
export async function openInMaps(dest: LatLng, label?: string): Promise<void> {
  const web = buildGoogleMapsUrl(dest.latitude, dest.longitude);
  const native = nativeGeoUrl(dest, label);
  const can = await Linking.canOpenURL(native).catch(() => false);
  await Linking.openURL(can ? native : web);
}

/** Turn-by-turn directions to a coordinate, in the user's maps app. */
export async function openDirections(dest: LatLng): Promise<void> {
  const web = `https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}`;
  const native =
    Platform.OS === "ios"
      ? `maps://?daddr=${dest.latitude},${dest.longitude}`
      : `google.navigation:q=${dest.latitude},${dest.longitude}`;
  const can = await Linking.canOpenURL(native).catch(() => false);
  await Linking.openURL(can ? native : web);
}

function nativeGeoUrl(c: LatLng, label?: string): string {
  if (Platform.OS === "ios") {
    return `maps://?ll=${c.latitude},${c.longitude}&q=${encodeURIComponent(
      label ?? `${c.latitude},${c.longitude}`,
    )}`;
  }
  const marker = label ? `(${label})` : "";
  return `geo:${c.latitude},${c.longitude}?q=${c.latitude},${c.longitude}${encodeURIComponent(
    marker,
  )}`;
}
