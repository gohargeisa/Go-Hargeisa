"use client";

import type { ReactNode } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_CONFIGURED } from "@/lib/config/google-maps";

/**
 * Loads the Google Maps JavaScript SDK exactly once for the whole app —
 * mounted in the root layout so every map component below it (hotel/
 * restaurant/cafe/attraction detail pages, Smart City Map, the Diaspora
 * Week map, the admin location picker) can use <Map>/<AdvancedMarker>
 * directly without each re-loading the script.
 *
 * Renders children unchanged when no API key is configured (e.g. local
 * dev without one set up yet) instead of throwing — individual map
 * components fall back to a "map unavailable" placeholder in that case.
 */
export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  if (!GOOGLE_MAPS_CONFIGURED) return <>{children}</>;

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["marker"]}>
      {children}
    </APIProvider>
  );
}
