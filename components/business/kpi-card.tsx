import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

export function KpiCard({
  icon: Icon,
  value,
  growthPercent,
  label,
  subtitle,
}: {
  icon: LucideIcon;
  value: string | number;
  /** null when there's no prior-day data to compare against yet. */
  growthPercent: number | null;
  label: string;
  subtitle: string;
}) {
  const isUp = growthPercent !== null && growthPercent >= 0;

  return (
    <div className="group rounded-2xl border border-ink/8 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
          <Icon size={20} aria-hidden="true" />
        </span>
        {growthPercent !== null && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-bold ${
              isUp ? "bg-accent/10 text-accent-600" : "bg-red-500/10 text-red-600"
            }`}
          >
            {isUp ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}
            {Math.abs(growthPercent)}%
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm font-semibold text-ink/70 dark:text-sand/70">{label}</p>
      <p className="mt-0.5 text-xs text-ink/45 dark:text-sand/45">{subtitle}</p>
    </div>
  );
}
