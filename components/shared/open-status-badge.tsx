"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getOpenStatus, getHargeisaNow, formatTime12h } from "@/lib/utils/opening-hours";
import type { OpeningHoursGroup } from "@/types";

/**
 * Computed on the client (not baked into the SSR/ISR html) against
 * getHargeisaNow() — Africa/Mogadishu time (Hargeisa/Somaliland's real UTC
 * offset, no DST) — rather than the visitor's own device clock, since a
 * business's Open/Closed state is a fact about Hargeisa local time, not
 * about whichever timezone happens to be reading the page. Still computed
 * client-side (not baked into the SSR/ISR html) so the badge doesn't go
 * stale between hourly revalidates. Renders nothing until mounted to avoid
 * a hydration mismatch, since the server has no reliable "now" to render
 * this with — and renders nothing at all when there's no hours data and no
 * closure override set (an unconfigured listing shouldn't claim "Closed").
 *
 * Translates its own label text via `useTranslations("detail")` instead of
 * accepting formatter functions as props — every call site used to build
 * `labels={{ opensAt: (time) => td("opensAt", { time }), ... }}` in a server
 * component and hand it to this "use client" component, which is a plain
 * closure crossing the Server→Client boundary. React can't serialize that:
 * it throws "Functions cannot be passed directly to Client Components" the
 * moment the element is actually constructed — which only happens for a
 * listing with real hours data (open/close groups, is24Hours, or a closure
 * override), so the bug stayed latent everywhere except Beydan Coffee (the
 * only listing with populated opening_hours_structured at the time). Doing
 * the translation in here, where next-intl's client hook already works,
 * removes the closure-prop entirely instead of formatting it differently.
 */
export function OpenStatusBadge({
  groups,
  is24Hours,
  temporarilyClosed,
  permanentlyClosed,
  className,
}: {
  groups: OpeningHoursGroup[];
  is24Hours?: boolean;
  temporarilyClosed?: boolean;
  permanentlyClosed?: boolean;
  className?: string;
}) {
  const t = useTranslations("detail");
  const [status, setStatus] = useState<ReturnType<typeof getOpenStatus> | null>(null);

  useEffect(() => {
    setStatus(getOpenStatus(groups, { is24Hours, temporarilyClosed, permanentlyClosed }, getHargeisaNow()));
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
        return t("openNow");
      case "closesSoon":
        return t("closesInMinutes", { minutes: status.minutesLeft });
      case "opensAt":
        return t("opensAt", { time: formatTime12h(status.time) });
      case "closed":
        return t("closedNow");
      case "temporarilyClosed":
        return t("temporarilyClosedNow");
      case "permanentlyClosed":
        return t("permanentlyClosedNow");
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
