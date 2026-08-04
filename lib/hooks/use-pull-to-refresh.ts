"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useNetworkStatus } from "@/lib/hooks/use-network-status";
import { refreshCurrentRoute } from "@/lib/offline/refresh-current-route";

export const PULL_THRESHOLD_PX = 70;
const MAX_PULL_PX = 120;
/** router.refresh() exposes no completion signal — this just gives the
 * indicator a moment to read as "refreshing" instead of snapping back
 * instantly. */
const REFRESHING_DISPLAY_MS = 900;

export type PullPhase = "idle" | "pulling" | "releasing" | "refreshing";

/**
 * Touch-based overscroll-at-top gesture, attached directly to `document` —
 * deliberately not nested inside any existing component's tree, so no
 * existing markup/styling changes at all (see pull-to-refresh-indicator.tsx,
 * mounted as one new sibling line in app/[locale]/layout.tsx). Online-only
 * per spec: while offline this simply doesn't attach any listeners.
 */
export function usePullToRefresh(): { phase: PullPhase; pullDistance: number; threshold: number } {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const [phase, setPhase] = useState<PullPhase>("idle");
  const [pullDistance, setPullDistance] = useState(0);

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const armedRef = useRef(false);

  useEffect(() => {
    if (!isOnline) return;

    function onTouchStart(e: TouchEvent) {
      armedRef.current = false;
      if (window.scrollY > 0) {
        startRef.current = null;
        return;
      }
      const t = e.touches[0];
      startRef.current = { x: t.clientX, y: t.clientY };
    }

    function onTouchMove(e: TouchEvent) {
      const start = startRef.current;
      if (!start) return;
      const t = e.touches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;

      if (!armedRef.current) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return; // too small to classify yet
        // Only a clearly-vertical, clearly-downward drag counts — this
        // alone (no opt-out attributes anywhere) keeps it from hijacking
        // horizontal carousels/swipers elsewhere in the app.
        if (dy <= 0 || Math.abs(dy) < Math.abs(dx) * 1.5) {
          startRef.current = null;
          return;
        }
        armedRef.current = true;
      }

      if (dy <= 0) {
        setPhase("idle");
        setPullDistance(0);
        return;
      }

      const distance = Math.min(dy, MAX_PULL_PX);
      setPullDistance(distance);
      setPhase(distance >= PULL_THRESHOLD_PX ? "releasing" : "pulling");
    }

    function onTouchEnd() {
      startRef.current = null;
      if (!armedRef.current) return;
      armedRef.current = false;

      setPhase((current) => {
        if (current !== "releasing") {
          setPullDistance(0);
          return "idle";
        }
        setPullDistance(PULL_THRESHOLD_PX);
        refreshCurrentRoute(router);
        setTimeout(() => {
          setPhase("idle");
          setPullDistance(0);
        }, REFRESHING_DISPLAY_MS);
        return "refreshing";
      });
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [isOnline, router]);

  return { phase, pullDistance, threshold: PULL_THRESHOLD_PX };
}
