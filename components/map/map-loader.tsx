"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "@/types";

const InteractiveMap = dynamic(
  () => import("./interactive-map").then((m) => m.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center rounded-xl3 border border-ink/8 dark:border-white/10 bg-ink/5 dark:bg-white/5 text-sm text-ink/50">
        Loading map…
      </div>
    ),
  }
);

export function MapLoader({ points }: { points: MapPoint[] }) {
  return <InteractiveMap points={points} />;
}
