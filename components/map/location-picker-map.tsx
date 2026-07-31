"use client";

import { useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Coordinates } from "@/types";
import { HARGEISA_CENTER } from "@/lib/mock-data";
import { MapResizeHandler } from "@/components/map/map-resize-handler";

const icon = L.divIcon({
  className: "",
  html: `<span style="background:#F59E0B" class="block h-6 w-6 rounded-full border-[3px] border-white shadow-lg"></span>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function ClickToPlace({ onPick }: { onPick: (coords: Coordinates) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/**
 * Click-anywhere-or-drag-the-pin location picker — the Leaflet/OpenStreetMap
 * equivalent of a "Google Maps picker": no API key, no billing, reuses the
 * same react-leaflet stack every other map on the site already runs on.
 * Latitude/longitude are derived entirely from where the marker ends up, so
 * the caller never has to type coordinates by hand.
 */
export function LocationPickerMap({
  value,
  onChange,
}: {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
}) {
  const center = value ?? HARGEISA_CENTER;

  const onDragEnd = useCallback(
    (e: L.DragEndEvent) => {
      const marker = e.target as L.Marker;
      const { lat, lng } = marker.getLatLng();
      onChange({ lat, lng });
    },
    [onChange]
  );

  return (
    <div className="h-72 w-full overflow-hidden rounded-xl2">
      <MapContainer center={[center.lat, center.lng]} zoom={14} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <MapResizeHandler />
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickToPlace onPick={onChange} />
        {value && (
          <Marker position={[value.lat, value.lng]} icon={icon} draggable eventHandlers={{ dragend: onDragEnd }} />
        )}
      </MapContainer>
    </div>
  );
}
