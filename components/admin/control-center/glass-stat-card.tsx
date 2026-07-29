import type { LucideIcon } from "lucide-react";

/** Frosted-glass stat tile, meant to sit on the control center's gradient
 * hero — flat white cards don't read as "glass," a colored backdrop behind
 * the blur is what makes the effect visible. */
export function GlassStatCard({
  icon: Icon,
  value,
  label,
  sublabel,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur-xl transition-all duration-300 ease-premium hover:-translate-y-1 hover:bg-white/15">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
        <Icon size={18} aria-hidden="true" />
      </div>
      <p className="mt-4 font-display text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm font-semibold text-white/85">{label}</p>
      {sublabel && <p className="mt-0.5 text-xs text-white/55">{sublabel}</p>}
    </div>
  );
}
