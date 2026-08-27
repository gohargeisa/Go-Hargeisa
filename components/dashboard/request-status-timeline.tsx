"use client";

import { Check } from "lucide-react";

/**
 * Small, mobile-friendly vertical stepper — no existing status-timeline
 * component to copy (checked: booking-confirmation-view.tsx just shows
 * status as one label/value row), so this is new but deliberately minimal,
 * built from the same rounded-xl2/border-ink-8 tokens used everywhere else
 * in the dashboard rather than a novel visual language. `stages` is the
 * ordered "happy path" for whichever request type is rendering this
 * (purchase vs event have different stage lists); `currentIndex` highlights
 * how far along the current status is. A terminal off-path status
 * (declined/cancelled/rejected) is handled by the caller passing
 * `currentIndex: -1` and its own message instead of forcing it onto the
 * stepper.
 */
export function RequestStatusTimeline({ stages, currentIndex }: { stages: string[]; currentIndex: number }) {
  return (
    <ol className="space-y-0">
      {stages.map((label, i) => {
        const done = currentIndex >= 0 && i < currentIndex;
        const active = i === currentIndex;
        const isLast = i === stages.length - 1;
        return (
          <li key={label} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && (
              <span
                className={`absolute start-[11px] top-6 h-full w-0.5 ${done || active ? "bg-primary" : "bg-ink/10 dark:bg-white/10"}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                done
                  ? "border-primary bg-primary text-white"
                  : active
                    ? "border-primary bg-white text-primary dark:bg-ink"
                    : "border-ink/15 bg-white text-ink/30 dark:border-white/15 dark:bg-ink dark:text-sand/30"
              }`}
            >
              {done ? <Check size={12} aria-hidden="true" /> : i + 1}
            </span>
            <span className={`pt-0.5 text-sm ${active ? "font-bold text-ink dark:text-sand" : done ? "font-medium text-ink/70 dark:text-sand/70" : "text-ink/40 dark:text-sand/40"}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
