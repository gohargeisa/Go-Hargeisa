"use client";

import dynamic from "next/dynamic";
import type { Coordinates } from "@/types";

const LocationPickerMap = dynamic(() => import("./location-picker-map").then((m) => m.LocationPickerMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 w-full items-center justify-center rounded-xl2 bg-ink/5 dark:bg-white/5 text-sm text-ink/50">
      Loading map…
    </div>
  ),
});

export function LocationPickerLoader({
  value,
  onChange,
}: {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
}) {
  return <LocationPickerMap value={value} onChange={onChange} />;
}
