"use client";

import dynamic from "next/dynamic";
import type { CityServicePoint } from "@/types";

const CityMap = dynamic(() => import("./city-map").then((m) => m.CityMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink/5 text-sm text-ink/50 dark:bg-white/5 dark:text-sand/50">
      Loading map…
    </div>
  ),
});

export function CityMapLoader({
  points,
  onSelectPoint,
}: {
  points: CityServicePoint[];
  onSelectPoint: (point: CityServicePoint) => void;
}) {
  return <CityMap points={points} onSelectPoint={onSelectPoint} />;
}
