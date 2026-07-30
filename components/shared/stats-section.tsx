import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/home/reveal";

export interface Stat {
  icon: LucideIcon;
  value: string;
  label: string;
}

const COLS_CLASS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

/**
 * Marketing stat-counter row (e.g. "500+ Listings"). Visually modeled on
 * the admin-only GlassStatCard's frosted-tile look (components/admin/
 * control-center/glass-stat-card.tsx) but built as its own component so
 * marketing pages don't depend on an admin-scoped file. `tone="dark"` sits
 * on a photo/gradient backdrop (frosted glass tiles); `tone="light"` sits
 * on a plain page background (solid white tiles).
 */
export function StatsSection({
  stats,
  tone = "light",
  className = "",
}: {
  stats: Stat[];
  tone?: "dark" | "light";
  className?: string;
}) {
  const dark = tone === "dark";
  const colsClass = COLS_CLASS[Math.min(stats.length, 4)] ?? "lg:grid-cols-4";

  return (
    <div className={`grid grid-cols-2 gap-4 sm:gap-5 ${colsClass} ${className}`}>
      {stats.map(({ icon: Icon, value, label }, i) => (
        <Reveal key={label} delay={i * 0.08}>
          <div
            className={`h-full rounded-2xl p-5 text-center transition-all duration-300 ease-premium hover:-translate-y-1 sm:p-6 ${
              dark
                ? "border border-white/25 bg-white/10 backdrop-blur-xl hover:bg-white/15"
                : "border border-ink/8 bg-white shadow-soft hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]"
            }`}
          >
            <span
              className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl ${
                dark ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
              }`}
            >
              <Icon size={20} aria-hidden="true" />
            </span>
            <p className={`mt-4 font-display text-3xl font-bold ${dark ? "text-white" : "text-ink dark:text-white"}`}>{value}</p>
            <p className={`mt-1 text-sm font-medium ${dark ? "text-white/80" : "text-ink/60 dark:text-sand/60"}`}>{label}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
