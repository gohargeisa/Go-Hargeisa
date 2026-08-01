/**
 * Single source of truth for Google Maps config — every map component
 * reads from here instead of `process.env` directly. `GOOGLE_MAPS_MAP_ID`
 * defaults to Google's public demo Map ID so the app doesn't hard-crash
 * without one configured, but Advanced Markers on a demo Map ID render
 * with default styling only — a real Map ID (Google Cloud Console → Map
 * Management) is required for custom marker styling in production.
 */
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
export const GOOGLE_MAPS_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";
export const GOOGLE_MAPS_CONFIGURED = GOOGLE_MAPS_API_KEY.length > 0;
