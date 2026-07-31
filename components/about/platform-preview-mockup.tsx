"use client";

import { m, useReducedMotion } from "framer-motion";
import { Landmark, MapPin, Search, Star } from "lucide-react";

/**
 * Illustrative browser-window mockup of the Go Hargeisa listing grid for the
 * About page's "Meet the Platform" section — no dashboard/analytics numbers
 * are shown here (that would read as a fabricated site-wide metric); it's a
 * UI preview only, same spirit as components/join/floating-phone-mockup.tsx's
 * illustrative "4.9" example rating on a single mock listing card.
 */
export function PlatformPreviewMockup({ searchPlaceholder }: { searchPlaceholder: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="relative mx-auto w-full max-w-md"
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-x-8 -bottom-6 h-10 rounded-full bg-black/25 blur-2xl" aria-hidden="true" />

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-premium-lg dark:border-white/10 dark:bg-ink">
        <div className="flex items-center gap-1.5 border-b border-ink/8 bg-sand/60 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/60" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent/60" aria-hidden="true" />
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-sand/60 px-3.5 py-2 dark:border-white/10 dark:bg-white/5">
            <Search size={14} className="shrink-0 text-ink/40 dark:text-sand/40" aria-hidden="true" />
            <span className="truncate text-xs text-ink/40 dark:text-sand/40">{searchPlaceholder}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-ink/8 bg-white shadow-soft dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="relative flex h-20 items-center justify-center bg-gradient-to-br from-secondary/15 via-primary/10 to-secondary/5 dark:from-secondary/25 dark:via-primary/15 dark:to-white/5">
                  <Landmark size={22} strokeWidth={1.5} className="text-secondary-700/50 dark:text-white/30" aria-hidden="true" />
                  <span className="absolute end-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-ink shadow-sm">
                    <Star size={8} fill="currentColor" className="text-primary" aria-hidden="true" />
                    4.8
                  </span>
                </div>
                <div className="space-y-1.5 p-2.5">
                  <span className="block h-2 w-4/5 rounded-full bg-ink/10 dark:bg-white/15" />
                  <span className="flex items-center gap-1">
                    <MapPin size={9} className="text-primary" aria-hidden="true" />
                    <span className="block h-1.5 w-2/3 rounded-full bg-ink/8 dark:bg-white/10" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 h-8 w-full rounded-full bg-primary/90" aria-hidden="true" />
        </div>
      </div>
    </m.div>
  );
}
