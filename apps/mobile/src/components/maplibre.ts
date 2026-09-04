/**
 * Single indirection point for `@maplibre/maplibre-react-native` (v11 renamed
 * its exports to `Map`, `Camera`, `Marker`). Everything in the app imports
 * MapLibre from here so a future swap / stub is one file, and so a load
 * failure degrades to `undefined` (handled by `PartnerMap`'s fallback)
 * rather than a hard crash.
 */
import type { ComponentType } from "react";

type AnyComponent = ComponentType<Record<string, unknown>>;

let map: AnyComponent | undefined;
let camera: AnyComponent | undefined;
let marker: AnyComponent | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@maplibre/maplibre-react-native");
  map = mod.Map;
  camera = mod.Camera;
  marker = mod.Marker;
} catch {
  // Native module unavailable (e.g. before a prebuild) — PartnerMap renders
  // its "Open in Maps" fallback instead.
}

export const MapView = map;
export const Camera = camera;
export const MapMarker = marker;
