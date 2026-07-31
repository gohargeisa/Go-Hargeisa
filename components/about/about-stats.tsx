"use client";

import { Building2, Coffee, Hotel as HotelIcon, Landmark, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/home/reveal";
import { AnimatedCounter } from "@/components/attractions/animated-counter";

export type AboutStatKey = "hotels" | "restaurants" | "cafes" | "attractions" | "cityServices";

export interface AboutStatItem {
  key: AboutStatKey;
  /** Real count only — pass 0 when the underlying data is empty/disabled; the tile shows "Coming Soon" instead of "0". */
  value: number;
}

// Icons are resolved here, inside the client component, rather than passed
// in as props — a Server Component can't pass a Lucide icon (a function)
// as a prop into a "use client" component; React can only serialize plain
// data across that boundary. See app/[locale]/about/page.tsx for the real
// (Supabase-backed) counts this component receives.
const STAT_META: Record<AboutStatKey, { icon: LucideIcon; labelKey: string }> = {
  hotels: { icon: HotelIcon, labelKey: "statsHotels" },
  restaurants: { icon: UtensilsCrossed, labelKey: "statsRestaurants" },
  cafes: { icon: Coffee, labelKey: "statsCafes" },
  attractions: { icon: Landmark, labelKey: "statsAttractions" },
  cityServices: { icon: Building2, labelKey: "statsCityServices" },
};

/**
 * Every value here must come from a real Supabase-backed count (see
 * app/[locale]/about/page.tsx) — never a hardcoded/estimated number. A
 * value of 0 is treated as "not live yet" and renders a "Coming Soon"
 * badge instead of an unimpressive/misleading "0", matching how the rest
 * of the site treats features gated by lib/config/features.ts.
 */
export function AboutStats({ stats }: { stats: AboutStatItem[] }) {
  const t = useTranslations("about");

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-5">
      {stats.map(({ key, value }, i) => {
        const { icon: Icon, labelKey } = STAT_META[key];
        return (
          <Reveal key={key} delay={i * 0.08}>
            <div className="h-full rounded-2xl border border-ink/8 bg-white p-5 text-center shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={20} aria-hidden="true" />
              </span>
              {value > 0 ? (
                <p className="mt-4 font-display text-3xl font-bold text-ink dark:text-white">
                  <AnimatedCounter value={value} suffix="+" />
                </p>
              ) : (
                <p className="mt-4 font-display text-lg font-bold text-ink/40 dark:text-sand/40">
                  {t("statsComingSoon")}
                </p>
              )}
              <p className="mt-1 text-sm font-medium text-ink/60 dark:text-sand/60">{t(labelKey)}</p>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
