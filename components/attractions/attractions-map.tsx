"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import { Landmark, Star } from "lucide-react";
import { MapResizeHandler } from "@/components/map/map-resize-handler";
import { HARGEISA_CENTER } from "@/lib/mock-data";

export interface AttractionMapPoint {
  id: string;
  href: string;
  name: string;
  image: string;
  rating: number;
  location: { lat: number; lng: number };
}

const MARKER_SVG = renderToStaticMarkup(<Landmark size={14} color="#fff" strokeWidth={2.5} />);

function pointIcon() {
  return L.divIcon({
    className: "",
    html: `<span style="background:#F59E0B" class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-lg">${MARKER_SVG}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function clusterIcon(count: number) {
  const size = count < 10 ? 36 : count < 30 ? 44 : 52;
  return L.divIcon({
    className: "",
    html: `<span style="background:#B45309;width:${size}px;height:${size}px" class="flex items-center justify-center rounded-full border-2 border-white text-[13px] font-bold text-white shadow-lg">${count}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface ClusterItem {
  key: string;
  lat: number;
  lng: number;
  points: AttractionMapPoint[];
}

/** Groups markers that fall within the same small pixel cell at the current zoom — cheap, dependency-free clustering (no leaflet.markercluster). */
function useClusters(points: AttractionMapPoint[]) {
  const map = useMap();
  const [clusters, setClusters] = useState<ClusterItem[]>([]);

  useEffect(() => {
    function recompute() {
      const zoom = map.getZoom();
      const cellPx = 56;
      const buckets = new Map<string, AttractionMapPoint[]>();

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

  return clusters;
}

function ClusterLayer({ points, openDetailsLabel }: { points: AttractionMapPoint[]; openDetailsLabel: string }) {
  const map = useMap();
  const clusters = useClusters(points);

  return (
    <>
      {clusters.map((cluster) => {
        if (cluster.points.length === 1) {
          const point = cluster.points[0];
          const hasRealImage = Boolean(point.image) && !point.image.includes("placehold.co");
          return (
            <Marker key={cluster.key} position={[cluster.lat, cluster.lng]} icon={pointIcon()}>
              <Popup minWidth={220}>
                <div className="w-48">
                  {hasRealImage && (
                    // eslint-disable-next-line @next/next/no-img-element -- Leaflet popups render outside React's layout tree; next/image's fill/intrinsic sizing doesn't work inside them.
                    <img
                      src={point.image}
                      alt={point.name}
                      className="mb-2 h-24 w-full rounded-lg object-cover"
                    />
                  )}
                  <p className="font-display text-sm font-bold text-ink">{point.name}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary-700">
                    <Star size={11} fill="currentColor" />
                    {point.rating.toFixed(1)}
                  </p>
                  <a
                    href={point.href}
                    className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                  >
                    {openDetailsLabel}
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        }

        return (
          <Marker
            key={cluster.key}
            position={[cluster.lat, cluster.lng]}
            icon={clusterIcon(cluster.points.length)}
            eventHandlers={{
              click: () => map.flyTo([cluster.lat, cluster.lng], Math.min(map.getZoom() + 2, 18), { duration: 0.5 }),
            }}
          />
        );
      })}
    </>
  );
}

export function AttractionsMap({ points, openDetailsLabel }: { points: AttractionMapPoint[]; openDetailsLabel: string }) {
  const center = points[0]?.location ?? HARGEISA_CENTER;

  return (
    <div className="h-full w-full">
      <MapContainer center={[center.lat, center.lng]} zoom={14} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <MapResizeHandler />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClusterLayer points={points} openDetailsLabel={openDetailsLabel} />
      </MapContainer>
    </div>
  );
}
