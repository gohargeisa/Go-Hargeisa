"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import { useTheme } from "next-themes";
import type { CityServicePoint } from "@/types";
import { CATEGORY_CONFIG } from "@/components/city-map/category-config";
import { HARGEISA_CENTER } from "@/lib/mock-data";
import { MapResizeHandler } from "@/components/map/map-resize-handler";

const MIXED_CLUSTER_COLOR = "#F59E0B";

function makePointIcon(point: CityServicePoint) {
  const meta = CATEGORY_CONFIG[point.category];
  const Icon = meta.icon;
  const svg = renderToStaticMarkup(<Icon size={14} color="#fff" strokeWidth={2.5} />);
  return L.divIcon({
    className: "",
    html: `<span style="background:${meta.color}" class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-lg">${svg}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function makeClusterIcon(count: number, color: string) {
  const size = count < 10 ? 36 : count < 50 ? 44 : 52;
  return L.divIcon({
    className: "",
    html: `<span style="background:${color};width:${size}px;height:${size}px" class="flex items-center justify-center rounded-full border-2 border-white text-[13px] font-bold text-white shadow-lg">${count}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface ClusterItem {
  key: string;
  lat: number;
  lng: number;
  points: CityServicePoint[];
}

function ClusterLayer({
  points,
  onSelect,
}: {
  points: CityServicePoint[];
  onSelect: (point: CityServicePoint) => void;
}) {
  const map = useMap();
  const [clusters, setClusters] = useState<ClusterItem[]>([]);

  useEffect(() => {
    function recompute() {
      const zoom = map.getZoom();
      const cellPx = 56;
      const buckets = new Map<string, CityServicePoint[]>();

      for (const point of points) {
        const pixel = map.latLngToContainerPoint([point.location.lat, point.location.lng]);
        const key = `${Math.floor(pixel.x / cellPx)}:${Math.floor(pixel.y / cellPx)}`;
        const bucket = buckets.get(key);
        if (bucket) bucket.push(point);
        else buckets.set(key, [point]);
      }

      const next: ClusterItem[] = [];
      buckets.forEach((pts, key) => {
        const lat = pts.reduce((sum, p) => sum + p.location.lat, 0) / pts.length;
        const lng = pts.reduce((sum, p) => sum + p.location.lng, 0) / pts.length;
        next.push({ key: `${key}:${zoom}`, lat, lng, points: pts });
      });
      setClusters(next);
    }

    recompute();
    map.on("zoomend", recompute);
    map.on("moveend", recompute);
    return () => {
      map.off("zoomend", recompute);
      map.off("moveend", recompute);
    };
  }, [map, points]);

  return (
    <>
      {clusters.map((cluster) => {
        if (cluster.points.length === 1) {
          const point = cluster.points[0];
          return (
            <Marker
              key={cluster.key}
              position={[cluster.lat, cluster.lng]}
              icon={makePointIcon(point)}
              eventHandlers={{ click: () => onSelect(point) }}
            />
          );
        }

        const categories = new Set(cluster.points.map((p) => p.category));
        const color = categories.size === 1 ? CATEGORY_CONFIG[cluster.points[0].category].color : MIXED_CLUSTER_COLOR;

        return (
          <Marker
            key={cluster.key}
            position={[cluster.lat, cluster.lng]}
            icon={makeClusterIcon(cluster.points.length, color)}
            eventHandlers={{
              click: () => map.flyTo([cluster.lat, cluster.lng], Math.min(map.getZoom() + 2, 18), { duration: 0.5 }),
            }}
          />
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className={`h-full w-full ${isDark ? "city-map-dark" : ""}`}>
      <MapContainer
        center={[HARGEISA_CENTER.lat, HARGEISA_CENTER.lng]}
        zoom={14}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <MapResizeHandler />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClusterLayer points={points} onSelect={onSelectPoint} />
      </MapContainer>
    </div>
  );
}
