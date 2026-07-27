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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-6">
          {cards.map((c, i) => (
            <div
              key={`${c.label}-${i}`}
              className="flex h-full flex-col items-center gap-2 rounded-xl2 border border-ink/8 bg-white px-3.5 py-5 text-center shadow-[0_2px_8px_rgba(15,23,42,0.05),0_10px_28px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <c.icon size={18} className="text-primary" aria-hidden="true" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
                {c.label}
              </p>
              <p className="truncate text-[15px] font-bold leading-tight text-ink dark:text-white">{c.value}</p>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
