"use client";

import { AdvancedMarker, Map, Pin, useMap } from "@vis.gl/react-google-maps";
import type { CityServicePoint } from "@/types";
import { CATEGORY_CONFIG } from "@/components/city-map/category-config";
import { useMarkerClusterer } from "@/lib/hooks/use-marker-clusterer";
import { HARGEISA_CENTER } from "@/lib/mock-data";
import { GOOGLE_MAPS_CONFIGURED, GOOGLE_MAPS_MAP_ID } from "@/lib/config/google-maps";
import { MapUnavailable } from "@/components/map/map-unavailable";

function ClusteredMarkers({
  points,
  onSelectPoint,
}: {
  points: CityServicePoint[];
  onSelectPoint: (point: CityServicePoint) => void;
}) {
  const map = useMap();
  const { setMarkerRef } = useMarkerClusterer(map);

  return (
    <>
      {points.map((point) => {
        const meta = CATEGORY_CONFIG[point.category];
        return (
          <AdvancedMarker
            key={point.id}
            position={point.location}
            title={point.name}
            ref={(marker) => setMarkerRef(marker, point.id)}
            onClick={() => {
              // Selecting a listing (clicking its marker — the only way to
              // select one on this map) centers the map on it, not just
              // opens its details in the side panel/bottom sheet.
              map?.panTo(point.location);
              onSelectPoint(point);
            }}
          >
            <Pin background={meta.color} borderColor="#ffffff" glyphColor="#ffffff" />
          </AdvancedMarker>
        );
      })}
    </>
  );
}

export function CityMap({
  points,
  onSelectPoint,
}: {
  points: CityServicePoint[];
  onSelectPoint: (point: CityServicePoint) => void;
}) {
  if (!GOOGLE_MAPS_CONFIGURED) {
    return (
      <div className="h-full w-full">
        <MapUnavailable />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Map
        mapId={GOOGLE_MAPS_MAP_ID}
        defaultCenter={HARGEISA_CENTER}
        defaultZoom={14}
        gestureHandling="greedy"
        colorScheme="FOLLOW_SYSTEM"
      >
        <ClusteredMarkers points={points} onSelectPoint={onSelectPoint} />
      </Map>
    </div>
  );
}
