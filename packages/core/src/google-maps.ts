/**
 * "Open in Google Maps" URL builders + a pasted-URL coordinate parser.
 * Source: the web app's `lib/utils/google-maps.ts` (pure; type-only import
 * of `Coordinates` from the shared types).
 *
 * The native app hands `buildGoogleMapsUrl(lat, lng)` (or a business's saved
 * `maps_url`) to `Linking.openURL(...)` → opens the Google Maps app, or the
 * OS map handler. This is external navigation, NOT the in-app MapLibre map.
 */
export {
  buildGoogleMapsUrl,
  resolveMapsUrl,
  parseGoogleMapsUrl,
} from "../../../lib/utils/google-maps";
