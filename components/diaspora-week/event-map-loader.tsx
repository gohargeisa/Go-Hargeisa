"use client";

import dynamic from "next/dynamic";
import type { EventMapPoint } from "./event-map";

const EventMap = dynamic(() => import("./event-map").then((m) => m.EventMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[440px] w-full items-center justify-center rounded-xl3 border border-ink/8 bg-ink/5 text-sm text-ink/50 dark:border-white/10 dark:bg-white/5">
      Loading map…
    </div>
  ),
});

export function EventMapLoader({ points }: { points: EventMapPoint[] }) {
  return <EventMap points={points} />;
}
