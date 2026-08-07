import { CheckCircle2, Circle } from "lucide-react";
import type { MissionChecklistItem } from "@/lib/data/owner-dashboard";

/** A launch-readiness checklist derived from real feature flags and data —
 * not invented targets. Each item reflects something actually true about
 * the platform's current state right now. */
export function MissionProgress({ items }: { items: MissionChecklistItem[] }) {
  const doneCount = items.filter((i) => i.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold">Mission Progress</h3>
        <span className="font-display text-xl font-bold text-primary-700">{percent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-premium"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-ink/45 dark:text-sand/45">
        {doneCount} of {items.length} launch milestones complete
      </p>

      <ul className="mt-5 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.key} className="flex items-start gap-3">
            {item.done ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-accent-600" aria-hidden="true" />
            ) : (
              <Circle size={18} className="mt-0.5 shrink-0 text-ink/25 dark:text-sand/25" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${item.done ? "text-ink dark:text-white" : "text-ink/60 dark:text-sand/60"}`}>
                {item.label}
              </p>
              <p className="text-xs text-ink/40 dark:text-sand/40">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
