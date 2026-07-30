import type { LucideIcon } from "lucide-react";

/** Frosted-glass stat tile, meant to sit on the control center's gradient
 * hero — flat white cards don't read as "glass," a colored backdrop behind
 * the blur is what makes the effect visible. */
export function GlassStatCard({
  icon: Icon,
  value,
  label,
  sublabel,
  tone = "bg-white/15 text-white",
  progressPercent,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  sublabel?: string;
  /** Icon badge classes — defaults to the original uniform glass tint.
   * Pass a tinted variant (e.g. "bg-violet-400/25 text-violet-100") to give
   * a specific stat its own identity in the consistent color system
   * (blue=views, green=bookings, orange=clicks, gold=premium, purple=partners). */
  tone?: string;
  /** 0-100. When set, renders a thin progress bar under the sublabel
   * (e.g. city coverage completion) instead of leaving the tile as a bare
   * number — optional so every other stat tile is unaffected. */
  progressPercent?: number;
}) {
  return (
    <div className="rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur-xl transition-all duration-300 ease-premium hover:-translate-y-1 hover:bg-white/15">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={18} aria-hidden="true" />
      </div>
      <p className="mt-4 font-display text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm font-semibold text-white/85">{label}</p>
      {sublabel && <p className="mt-0.5 text-xs text-white/55">{sublabel}</p>}
      {progressPercent !== undefined && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-white/70 transition-all duration-700 ease-premium"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
}
