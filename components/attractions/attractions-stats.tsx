"use client";

import { useTranslations } from "next-intl";
import { Layers, MapPinned, MessageSquare, Star } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { AnimatedCounter } from "./animated-counter";

export function AttractionsStats({
  total,
  categoryCount,
  topRatedCount,
  reviewCount,
}: {
  total: number;
  categoryCount: number;
  topRatedCount: number;
  reviewCount: number;
}) {
  const tp = useTranslations("attractionsPage");

  const stats = [
    { icon: MapPinned, value: total, label: tp("statsAttractions") },
    { icon: Layers, value: categoryCount, label: tp("statsCategories") },
    { icon: Star, value: topRatedCount, label: tp("statsTopRated") },
    { icon: MessageSquare, value: reviewCount, label: tp("statsReviews") },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
      {stats.map(({ icon: Icon, value, label }, i) => (
        <Reveal key={label} delay={i * 0.08}>
          <div className="h-full rounded-2xl border border-ink/8 bg-white p-5 text-center shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon size={20} aria-hidden="true" />
            </span>
            <p className="mt-4 font-display text-3xl font-bold text-ink dark:text-white">
              <AnimatedCounter value={value} />
            </p>
            <p className="mt-1 text-sm font-medium text-ink/60 dark:text-sand/60">{label}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
