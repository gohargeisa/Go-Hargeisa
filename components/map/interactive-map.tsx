"use client";

import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { MapPoint } from "@/types";
import { HARGEISA_CENTER } from "@/lib/mock-data";

const CATEGORY_META: Record<MapPoint["category"], { label: string; color: string }> = {
  hotel: { label: "Hotels", color: "#0B5ED7" },
  restaurant: { label: "Restaurants", color: "#F4B400" },
  hospital: { label: "Hospitals", color: "#E53935" },
  bank: { label: "Banks", color: "#009688" },
  atm: { label: "ATMs", color: "#00796B" },
  mosque: { label: "Mosques", color: "#6D4C41" },
  shopping: { label: "Shopping", color: "#8E24AA" },
  museum: { label: "Museums", color: "#5E35B1" },
  attraction: { label: "Attractions", color: "#EF6C00" },
};

function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="background:${color}" class="block h-4 w-4 rounded-full border-2 border-white shadow-md"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export function InteractiveMap({ points }: { points: MapPoint[] }) {
  const [active, setActive] = useState<Set<MapPoint["category"]>>(
    new Set(Object.keys(CATEGORY_META) as MapPoint["category"][])
  );

  const visible = useMemo(() => points.filter((p) => active.has(p.category)), [points, active]);

  function toggle(cat: MapPoint["category"]) {
    setActive((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  return (
    <div className="overflow-hidden rounded-xl3 border border-ink/8 dark:border-white/10 shadow-card">
      <div className="flex flex-wrap gap-2 border-b border-ink/8 dark:border-white/10 bg-white dark:bg-ink p-4">
        {(Object.entries(CATEGORY_META) as [MapPoint["category"], typeof CATEGORY_META[MapPoint["category"]]][]).map(
          ([cat, meta]) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggle(cat)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active.has(cat)
                  ? "border-transparent text-white"
                  : "border-ink/15 dark:border-white/20 text-ink/50 dark:text-sand/50"
              }`}
              style={active.has(cat) ? { backgroundColor: meta.color } : undefined}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: active.has(cat) ? "white" : meta.color }}
              />
              {meta.label}
            </button>
          )
        )}
      </div>
      <div className="h-[420px] w-full">
        <MapContainer
          center={[HARGEISA_CENTER.lat, HARGEISA_CENTER.lng]}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {visible.map((p) => (
            <Marker key={p.id} position={[p.location.lat, p.location.lng]} icon={makeIcon(CATEGORY_META[p.category].color)}>
              <Popup>
                <strong>{p.name}</strong>
                <br />
                <span className="capitalize">{p.category}</span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
