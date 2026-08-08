import { Hospital, Landmark, MoonStar, Pill } from "lucide-react";
import type { CityCoverageCategory } from "@/lib/data/owner-dashboard";

/** This widget always tracks the same 4 priority categories regardless of
 * how many City Services categories exist overall (see the fixed
 * CITY_SERVICE_CATEGORIES list in getCityCoverage) — it's a curated growth
 * KPI, not a reflection of every category. Supermarket is deliberately
 * excluded — it's a separate top-level module, not a City Services
 * category (see docs/supermarket-architecture.md). */
const META: Record<"hospital" | "bank" | "mosque" | "pharmacy", { label: string; icon: typeof Hospital }> = {
  hospital: { label: "Hospitals", icon: Hospital },
  bank: { label: "Banks", icon: Landmark },
  mosque: { label: "Mosques", icon: MoonStar },
  pharmacy: { label: "Pharmacies", icon: Pill },
};

export function CityCoverageProgress({
  categories,
  totalPublished,
  totalTarget,
}: {
  categories: CityCoverageCategory[];
  totalPublished: number;
  totalTarget: number;
}) {
  const percent = Math.round((totalPublished / totalTarget) * 100);

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold">City Coverage</h3>
        <span className="font-display text-xl font-bold text-primary-700">
          {totalPublished}/{totalTarget}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-premium"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-ink/45 dark:text-sand/45">
        Essential city services directory — {percent}% of the four-per-category target filled
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {categories.map(({ category, published, target }) => {
          const meta = META[category as keyof typeof META];
          if (!meta) return null;
          const Icon = meta.icon;
          const done = published >= target;
          return (
            <div
              key={category}
              className={`rounded-xl border p-3.5 ${
                done ? "border-accent/25 bg-accent/5" : "border-ink/8 dark:border-white/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon size={15} className={done ? "text-accent-600" : "text-ink/40 dark:text-sand/40"} aria-hidden="true" />
                <span className="text-xs font-semibold text-ink/70 dark:text-sand/70">{meta.label}</span>
              </div>
              <p className="mt-1.5 font-display text-lg font-bold">
                {published}
                <span className="text-sm font-medium text-ink/40 dark:text-sand/40">/{target}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
