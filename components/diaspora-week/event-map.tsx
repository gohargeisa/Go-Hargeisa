"use client";

import { useMemo, useState } from "react";
import { AdvancedMarker, InfoWindow, Map, Pin, useMap } from "@vis.gl/react-google-maps";
import { useTranslations } from "next-intl";
import { Navigation, ExternalLink } from "lucide-react";
import { HARGEISA_CENTER } from "@/lib/mock-data";
import { GOOGLE_MAPS_CONFIGURED, GOOGLE_MAPS_MAP_ID } from "@/lib/config/google-maps";
import { MapUnavailable } from "@/components/map/map-unavailable";
import { useMarkerClusterer } from "@/lib/hooks/use-marker-clusterer";

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

function ClusteredMarkers({
  points,
  onSelect,
}: {
  points: EventMapPoint[];
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
          <Pin
            background={CATEGORY_COLOR[point.category]}
            borderColor="#ffffff"
            glyphColor="#ffffff"
            scale={point.category === "venue" ? 1.25 : 1}
          />
        </AdvancedMarker>
      ))}
    </>
  );
}

/**
 * Self-contained Google Map for the Diaspora Week page only — deliberately
 * not built on top of the Smart City Map's category set/colors, which
 * don't include "cafe" or a "venue" pin (same isolation pattern already
 * used by components/home/premium-*-card.tsx vs. components/shared/*-card.tsx
 * elsewhere in this codebase).
 */
export function EventMap({ points }: { points: EventMapPoint[] }) {
  const t = useTranslations("diasporaWeek");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
  const selected = visible.find((p) => p.id === selectedId) ?? null;
  const directionsHref = selected
    ? `https://www.google.com/maps/dir/?api=1&destination=${selected.location.lat},${selected.location.lng}`
    : undefined;
  const googleMapsHref = selected
    ? `https://www.google.com/maps/search/?api=1&query=${selected.location.lat},${selected.location.lng}`
    : undefined;

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
        {!GOOGLE_MAPS_CONFIGURED ? (
          <MapUnavailable />
        ) : (
          <Map
            mapId={GOOGLE_MAPS_MAP_ID}
            defaultCenter={HARGEISA_CENTER}
            defaultZoom={13}
            gestureHandling="cooperative"
            colorScheme="FOLLOW_SYSTEM"
          >
            <ClusteredMarkers points={visible} onSelect={setSelectedId} />

            {selected && (
              <InfoWindow position={selected.location} onCloseClick={() => setSelectedId(null)} maxWidth={220}>
                <div className="w-44">
                  <p className="font-display text-sm font-bold text-ink">{selected.name}</p>
                  <p className="mt-0.5 text-xs text-ink/60">{categoryLabel[selected.category]}</p>
                  {selected.href && (
                    <a
                      href={selected.href}
                      className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                    >
                      {t("mapViewDetails")}
                    </a>
                  )}
                  <div className="mt-1.5 flex gap-1.5">
                    <a
                      href={directionsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-ink/15 px-2 py-1.5 text-[11px] font-semibold text-ink hover:border-primary hover:text-primary"
                    >
                      <Navigation size={11} aria-hidden="true" />
                      {t("mapDirections")}
                    </a>
                    <a
                      href={googleMapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-ink/15 px-2 py-1.5 text-[11px] font-semibold text-ink hover:border-primary hover:text-primary"
                    >
                      {t("mapOpenInMaps")}
                      <ExternalLink size={11} aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        )}
      </div>
    </div>
  );
}
