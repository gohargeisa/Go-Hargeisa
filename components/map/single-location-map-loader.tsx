"use client";

import dynamic from "next/dynamic";
import type { Coordinates } from "@/types";

const SingleLocationMap = dynamic(
  () => import("./single-location-map").then((m) => m.SingleLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 w-full items-center justify-center rounded-xl2 bg-ink/5 dark:bg-white/5 text-sm text-ink/50">
        Loading map…
      </div>
    ),
  }
);

export function SingleLocationMapLoader({ location, label }: { location: Coordinates; label: string }) {
  return <SingleLocationMap location={location} label={label} />;
}
