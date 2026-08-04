"use client";

import { RefreshCw } from "lucide-react";
import { m, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePullToRefresh } from "@/lib/hooks/use-pull-to-refresh";

/**
 * Visual half of the pull-to-refresh gesture (lib/hooks/use-pull-to-
 * refresh.ts owns the touch logic). Renders nothing at all until a pull is
 * actually in progress, and lives entirely outside every other component's
 * tree — mounted as one new sibling line in app/[locale]/layout.tsx.
 */
export function PullToRefreshIndicator() {
  const t = useTranslations("offline");
  const reduceMotion = useReducedMotion();
  const { phase, pullDistance, threshold } = usePullToRefresh();

  if (phase === "idle") return null;

  const label =
    phase === "releasing"
      ? t("pullToRefreshReleasing")
      : phase === "refreshing"
        ? t("pullToRefreshRefreshing")
        : t("pullToRefreshHint");

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <m.div
        initial={reduceMotion ? undefined : { opacity: 0, y: -20 }}
        animate={{ opacity: progress, y: Math.min(pullDistance, threshold) - 8 }}
        transition={{ duration: reduceMotion ? 0 : 0.15 }}
        className="glass mt-2 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-ink shadow-premium dark:text-white"
      >
        <RefreshCw
          size={15}
          className={phase === "refreshing" ? "animate-spin" : ""}
          style={phase !== "refreshing" ? { transform: `rotate(${progress * 180}deg)` } : undefined}
          aria-hidden="true"
        />
        {label}
      </m.div>
    </div>
  );
}
