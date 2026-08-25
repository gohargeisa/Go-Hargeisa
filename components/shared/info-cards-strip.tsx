import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/home/reveal";

export interface InfoCard {
  icon: LucideIcon;
  label: string;
  value: string;
}

/**
 * Shared "at-a-glance facts" strip rendered below the action bar on every
 * detail page (hotel/restaurant/cafe) — extracted from the hotel-only
 * implementation so all three can reuse the exact same grid, animation and
 * card chrome while each supplies its own listing-type-specific `cards`.
 */
export function InfoCardsStrip({ cards }: { cards: InfoCard[] }) {
  return (
    <Reveal delay={0.1}>
      <div className="container-px mx-auto mt-6">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-6">
          {cards.map((c, i) => (
            <div
              key={`${c.label}-${i}`}
              className="flex min-w-0 items-center gap-2.5 rounded-xl2 border border-ink/8 bg-white px-3 py-3 shadow-soft transition-transform duration-200 hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <c.icon size={16} className="text-primary" aria-hidden="true" />
              </span>
              <span className="min-w-0 text-start">
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-ink/70 dark:text-sand/70">
                  {c.label}
                </p>
                <p className="text-[13px] font-bold leading-tight text-ink dark:text-white [overflow-wrap:anywhere] line-clamp-2">
                  {c.value}
                </p>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
