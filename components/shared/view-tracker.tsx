"use client";

import { useEffect, useRef } from "react";
import { trackMetricEvent } from "@/lib/actions/business";
import type { BusinessListingType } from "@/types";

/**
 * Fires a real "view" metric event once per actual browser page load.
 * Deliberately a client component: this page has `revalidate = 3600`
 * (ISR), so a tracking call embedded in the server component's data
 * fetching would only fire once per hourly regeneration, not per visitor —
 * client-side is the only way to count real per-visit traffic on a cached
 * page. Renders nothing.
 */
export function ViewTracker({ listingType, listingId }: { listingType: BusinessListingType; listingId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void trackMetricEvent(listingType, listingId, "view");
  }, [listingType, listingId]);

  return null;
}
