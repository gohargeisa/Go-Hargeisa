"use client";

import { AdvancedMarker, Map, Pin } from "@vis.gl/react-google-maps";
import type { Coordinates } from "@/types";
import { GOOGLE_MAPS_CONFIGURED, GOOGLE_MAPS_MAP_ID } from "@/lib/config/google-maps";
import { MapUnavailable } from "@/components/map/map-unavailable";

export function SingleLocationMap({ location, label }: { location: Coordinates; label: string }) {
  if (!GOOGLE_MAPS_CONFIGURED) {
    return (
      <div className="h-72 w-full overflow-hidden rounded-xl2">
        <MapUnavailable />
      </div>
    );
  }

  return (
    <div className="h-72 w-full overflow-hidden rounded-xl2">
      <Map
        mapId={GOOGLE_MAPS_MAP_ID}
        defaultCenter={location}
        defaultZoom={15}
        gestureHandling="cooperative"
        colorScheme="FOLLOW_SYSTEM"
        disableDefaultUI={false}
        fullscreenControl={false}
        streetViewControl={false}
      >
        <AdvancedMarker position={location} title={label}>
          <Pin background="#0B5ED7" borderColor="#ffffff" glyphColor="#ffffff" />
        </AdvancedMarker>
      </Map>
    </div>
  );
}
