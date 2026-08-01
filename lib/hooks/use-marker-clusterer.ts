"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

/**
 * Wraps @googlemaps/markerclusterer for use with @vis.gl/react-google-maps'
 * <AdvancedMarker> — the standard integration pattern for the two
 * libraries (neither ships a built-in "just works together" component).
 * Each <AdvancedMarker> reports its underlying marker element via
 * `setMarkerRef(marker, key)` on mount/unmount; the clusterer is kept in
 * sync with whatever set of markers is currently mounted, so filtering the
 * points array (category toggles, search) automatically re-clusters.
 */
export function useMarkerClusterer(map: google.maps.Map | null) {
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const [markers, setMarkers] = useState<Record<string, google.maps.marker.AdvancedMarkerElement>>({});

  useEffect(() => {
    if (!map) return;
    clustererRef.current = new MarkerClusterer({ map });
    return () => {
      clustererRef.current?.setMap(null);
      clustererRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const clusterer = clustererRef.current;
    if (!clusterer) return;
    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markers));
  }, [markers]);

  const setMarkerRef = useCallback((marker: google.maps.marker.AdvancedMarkerElement | null, key: string) => {
    setMarkers((prev) => {
      if (marker && prev[key] === marker) return prev;
      if (!marker && !prev[key]) return prev;
      const next = { ...prev };
      if (marker) next[key] = marker;
      else delete next[key];
      return next;
    });
  }, []);

  return { setMarkerRef };
}
