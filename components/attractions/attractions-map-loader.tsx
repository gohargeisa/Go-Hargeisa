"use client";

import dynamic from "next/dynamic";
import type { AttractionMapPoint } from "./attractions-map";

const AttractionsMap = dynamic(() => import("./attractions-map").then((m) => m.AttractionsMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl2 bg-ink/5 text-sm text-ink/50 dark:bg-white/5 dark:text-sand/50">
      Loading map…
    </div>
  ),
});

export function AttractionsMapLoader({ points, openDetailsLabel }: { points: AttractionMapPoint[]; openDetailsLabel: string }) {
  return <AttractionsMap points={points} openDetailsLabel={openDetailsLabel} />;
}
