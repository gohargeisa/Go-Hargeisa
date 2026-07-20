"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Coordinates } from "@/types";

const icon = L.divIcon({
  className: "",
  html: `<span style="background:#0B5ED7" class="block h-5 w-5 rounded-full border-2 border-white shadow-lg"></span>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export function SingleLocationMap({ location, label }: { location: Coordinates; label: string }) {
  return (
    <div className="h-72 w-full overflow-hidden rounded-xl2">
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[location.lat, location.lng]} icon={icon}>
          <Popup>{label}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
