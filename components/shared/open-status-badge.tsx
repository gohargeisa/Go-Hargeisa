"use client";

import { useEffect, useState } from "react";
import { getOpenStatus, formatTime12h } from "@/lib/utils/opening-hours";
import type { OpeningHoursGroup } from "@/types";

export interface OpenStatusLabels {
  open: string;
  closed: string;
  opensAt: (time: string) => string;
  closesInMinutes: (minutes: number) => string;
  temporarilyClosed: string;
  permanentlyClosed: string;
}

/**
 * Computed on the client (not baked into the SSR/ISR html) so the badge
 * reflects the visitor's own clock/timezone, not the last hourly revalidate
 * or a fixed business-local time. Renders nothing until mounted to avoid a
 * hydration mismatch, since the server has no reliable "now" to render
 * this with — and renders nothing at all when there's no hours data and no
 * closure override set (an unconfigured listing shouldn't claim "Closed").
 */
export function OpenStatusBadge({
  groups,
  is24Hours,
  temporarilyClosed,
  permanentlyClosed,
  labels,
  className,
}: {
  groups: OpeningHoursGroup[];
  is24Hours?: boolean;
  temporarilyClosed?: boolean;
  permanentlyClosed?: boolean;
  labels: OpenStatusLabels;
  className?: string;
}) {
  const [status, setStatus] = useState<ReturnType<typeof getOpenStatus> | null>(null);

  useEffect(() => {
    setStatus(getOpenStatus(groups, { is24Hours, temporarilyClosed, permanentlyClosed }));
  }, [groups, is24Hours, temporarilyClosed, permanentlyClosed]);

  if (status === null) return null;
  if (status.state === "closed" && groups.length === 0 && !is24Hours && !temporarilyClosed && !permanentlyClosed) return null;

  const tone: Record<typeof status.state, { dot: string; text: string }> = {
    open: { dot: "bg-green-600 dark:bg-green-400", text: "bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-400" },
    closesSoon: { dot: "bg-orange-600 dark:bg-orange-400", text: "bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-400" },
    opensAt: { dot: "bg-amber-500 dark:bg-amber-400", text: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400" },
    closed: { dot: "bg-red-600 dark:bg-red-400", text: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-400" },
    temporarilyClosed: { dot: "bg-ink/40 dark:bg-sand/40", text: "bg-ink/8 text-ink/60 dark:bg-white/10 dark:text-sand/60" },
    permanentlyClosed: { dot: "bg-ink/40 dark:bg-sand/40", text: "bg-ink/8 text-ink/60 dark:bg-white/10 dark:text-sand/60" },
  };

  const label = (() => {
    switch (status.state) {
      case "open":
        return labels.open;
      case "closesSoon":
        return labels.closesInMinutes(status.minutesLeft);
      case "opensAt":
        return labels.opensAt(formatTime12h(status.time));
      case "closed":
        return labels.closed;
      case "temporarilyClosed":
        return labels.temporarilyClosed;
      case "permanentlyClosed":
        return labels.permanentlyClosed;
    }
  })();

  const { dot, text } = tone[status.state];

  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${text} ${className ?? ""}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
