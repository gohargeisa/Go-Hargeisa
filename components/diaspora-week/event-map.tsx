"use client";

import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { HARGEISA_CENTER } from "@/lib/mock-data";
import { MapResizeHandler } from "@/components/map/map-resize-handler";

export type EventMapCategory = "venue" | "hotel" | "restaurant" | "cafe" | "attraction";

export interface EventMapPoint {
  id: string;
  name: string;
  category: EventMapCategory;
  location: { lat: number; lng: number };
  href?: string;
}

const CATEGORY_COLOR: Record<EventMapCategory, string> = {
  venue: "#D62839",
  hotel: "#0B5ED7",
  restaurant: "#F4B400",
  cafe: "#6D4C41",
  attraction: "#EF6C00",
};

function makeIcon(color: string, big: boolean) {
  const size = big ? 22 : 16;
  return L.divIcon({
    className: "",
    html: `<span style="background:${color};width:${size}px;height:${size}px" class="block rounded-full border-2 border-white shadow-md"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Self-contained Leaflet map for the Diaspora Week page only — deliberately
 * not built on top of components/map/interactive-map.tsx, whose category
 * set/colors are hardcoded and don't include "cafe" or a "venue" pin;
 * extending that shared component would risk the existing city-map page
 * (same isolation pattern already used by components/home/premium-*-card.tsx
 * vs. components/shared/*-card.tsx elsewhere in this codebase).
 */
export function EventMap({ points }: { points: EventMapPoint[] }) {
  const t = useTranslations("diasporaWeek");
  const router = useRouter();
  const [active, setActive] = useState<Set<EventMapCategory>>(
    new Set(["venue", "hotel", "restaurant", "cafe", "attraction"])
  );

  const categoryLabel: Record<EventMapCategory, string> = {
    venue: t("mapCategoryVenue"),
    hotel: t("mapCategoryHotel"),
    restaurant: t("mapCategoryRestaurant"),
    cafe: t("mapCategoryCafe"),
    attraction: t("mapCategoryAttraction"),
  };

  const presentCategories = useMemo(
    () => (Object.keys(categoryLabel) as EventMapCategory[]).filter((c) => points.some((p) => p.category === c)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points]
  );

  const visible = useMemo(() => points.filter((p) => active.has(p.category)), [points, active]);

  function toggle(cat: EventMapCategory) {
    setActive((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  return (
    <div className="overflow-hidden rounded-xl3 border border-ink/8 shadow-card dark:border-white/10">
      <div className="flex flex-wrap gap-2 border-b border-ink/8 bg-white p-4 dark:border-white/10 dark:bg-ink">
        {presentCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => toggle(cat)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              active.has(cat) ? "border-transparent text-white" : "border-ink/15 text-ink/50 dark:border-white/20 dark:text-sand/50"
            }`}
            style={active.has(cat) ? { backgroundColor: CATEGORY_COLOR[cat] } : undefined}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active.has(cat) ? "white" : CATEGORY_COLOR[cat] }} />
            {categoryLabel[cat]}
          </button>
        ))}
      </div>
      <div className="h-[440px] w-full">
        <MapContainer
          center={[HARGEISA_CENTER.lat, HARGEISA_CENTER.lng]}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <MapResizeHandler />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {visible.map((p) => (
            <Marker
              key={p.id}
              position={[p.location.lat, p.location.lng]}
              icon={makeIcon(CATEGORY_COLOR[p.category], p.category === "venue")}
              eventHandlers={p.href ? { click: () => router.push(p.href!) } : undefined}
            >
              <Popup>
                <strong>{p.name}</strong>
                <br />
                <span>{categoryLabel[p.category]}</span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
