"use client";

import { AdvancedMarker, Map, Pin } from "@vis.gl/react-google-maps";
import type { Coordinates } from "@/types";
import { HARGEISA_CENTER } from "@/lib/mock-data";
import { GOOGLE_MAPS_CONFIGURED, GOOGLE_MAPS_MAP_ID } from "@/lib/config/google-maps";
import { MapUnavailable } from "@/components/map/map-unavailable";

/**
 * Click-anywhere-or-drag-the-pin location picker. Latitude/longitude are
 * derived entirely from where the marker ends up, so the caller never has
 * to type coordinates by hand.
 */
export function LocationPickerMap({
  value,
  onChange,
}: {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
}) {
  if (!GOOGLE_MAPS_CONFIGURED) {
    return (
      <div className="h-72 w-full overflow-hidden rounded-xl2">
        <MapUnavailable />
      </div>
    );
  }

  const center = value ?? HARGEISA_CENTER;

  return (
    <div className="h-72 w-full overflow-hidden rounded-xl2">
      <Map
        mapId={GOOGLE_MAPS_MAP_ID}
        defaultCenter={center}
        defaultZoom={14}
        gestureHandling="cooperative"
        colorScheme="FOLLOW_SYSTEM"
        onClick={(e) => {
          if (e.detail.latLng) onChange({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
        }}
      >
        {value && (
          <AdvancedMarker
            position={value}
            draggable
            onDragEnd={(e) => {
              if (e.latLng) onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            }}
          >
            <Pin background="#F59E0B" borderColor="#ffffff" glyphColor="#ffffff" />
          </AdvancedMarker>
        )}
      </Map>
    </div>
  );
}
