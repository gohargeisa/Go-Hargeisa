"use client";

import { useEffect, useState } from "react";
import { isOpenNow } from "@/lib/utils/opening-hours";
import type { OpeningHoursGroup } from "@/types";

/**
 * Computed on the client (not baked into the SSR/ISR html) so the badge
 * reflects the visitor's actual moment, not the last hourly revalidate.
 * Renders nothing until mounted to avoid a hydration mismatch, since the
 * server has no reliable "now" to render this with.
 */
export function OpenStatusBadge({
  groups,
  openLabel,
  closedLabel,
  className,
}: {
  groups: OpeningHoursGroup[];
  openLabel: string;
  closedLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    setOpen(isOpenNow(groups));
  }, [groups]);

  if (open === null) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        open
          ? "bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-400"
      } ${className ?? ""}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${open ? "bg-green-600 dark:bg-green-400" : "bg-red-600 dark:bg-red-400"}`} aria-hidden="true" />
      {open ? openLabel : closedLabel}
    </span>
  );
}
