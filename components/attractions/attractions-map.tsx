"use client";

import { useState } from "react";
import { AdvancedMarker, InfoWindow, Map, Pin, useMap } from "@vis.gl/react-google-maps";
import { Navigation, ExternalLink, Star } from "lucide-react";
import { useMarkerClusterer } from "@/lib/hooks/use-marker-clusterer";
import { HARGEISA_CENTER } from "@/lib/mock-data";
import { GOOGLE_MAPS_CONFIGURED, GOOGLE_MAPS_MAP_ID } from "@/lib/config/google-maps";
import { MapUnavailable } from "@/components/map/map-unavailable";

export interface AttractionMapPoint {
  id: string;
  href: string;
  name: string;
  image: string;
  rating: number;
  location: { lat: number; lng: number };
}

function ClusteredMarkers({
  points,
  onSelect,
}: {
  points: AttractionMapPoint[];
  onSelect: (id: string) => void;
}) {
  const map = useMap();
  const { setMarkerRef } = useMarkerClusterer(map);

  return (
    <>
      {points.map((point) => (
        <AdvancedMarker
          key={point.id}
          position={point.location}
          title={point.name}
          ref={(marker) => setMarkerRef(marker, point.id)}
          onClick={() => onSelect(point.id)}
        >
          <Pin background="#F59E0B" borderColor="#ffffff" glyphColor="#ffffff" />
        </AdvancedMarker>
      ))}
    </>
  );
}

export function AttractionsMap({ points, openDetailsLabel }: { points: AttractionMapPoint[]; openDetailsLabel: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!GOOGLE_MAPS_CONFIGURED) {
    return (
      <div className="h-full w-full">
        <MapUnavailable />
      </div>
    );
  }

  const center = points[0]?.location ?? HARGEISA_CENTER;
  const selected = points.find((p) => p.id === selectedId) ?? null;
  const hasRealImage = Boolean(selected?.image) && !selected!.image.includes("placehold.co");
  const directionsHref = selected
    ? `https://www.google.com/maps/dir/?api=1&destination=${selected.location.lat},${selected.location.lng}`
    : undefined;
  const googleMapsHref = selected
    ? `https://www.google.com/maps/search/?api=1&query=${selected.location.lat},${selected.location.lng}`
    : undefined;

  return (
    <div className="h-full w-full">
      <Map
        mapId={GOOGLE_MAPS_MAP_ID}
        defaultCenter={center}
        defaultZoom={14}
        gestureHandling="cooperative"
        colorScheme="FOLLOW_SYSTEM"
      >
        <ClusteredMarkers points={points} onSelect={setSelectedId} />

        {selected && (
          <InfoWindow position={selected.location} onCloseClick={() => setSelectedId(null)} maxWidth={240}>
            <div className="w-48">
              {hasRealImage && (
                // eslint-disable-next-line @next/next/no-img-element -- InfoWindow content renders outside React's layout tree; next/image's fill/intrinsic sizing doesn't work inside it.
                <img src={selected.image} alt={selected.name} className="mb-2 h-24 w-full rounded-lg object-cover" />
              )}
              <p className="font-display text-sm font-bold text-ink">{selected.name}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary-700">
                <Star size={11} fill="currentColor" />
                {selected.rating.toFixed(1)}
              </p>
              <a
                href={selected.href}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
              >
                {openDetailsLabel}
              </a>
              <div className="mt-1.5 flex gap-1.5">
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-ink/15 px-2 py-1.5 text-[11px] font-semibold text-ink hover:border-primary hover:text-primary"
                >
                  <Navigation size={11} aria-hidden="true" />
                  Directions
                </a>
                <a
                  href={googleMapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-ink/15 px-2 py-1.5 text-[11px] font-semibold text-ink hover:border-primary hover:text-primary"
                >
                  Maps
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
