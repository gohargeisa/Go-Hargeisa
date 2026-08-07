import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/home/reveal";

export interface TimelineStep {
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
}

/**
 * Numbered step-by-step component — generalizes the visual pattern from
 * join/how-it-works-section.tsx (connecting line on desktop, staggered
 * Reveal per step, numbered icon badge) into a reusable building block for
 * any "how it works" / "trip planning steps" / "our story" section.
 */
const COLS_CLASS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
};

export function Timeline({ steps, className = "" }: { steps: TimelineStep[]; className?: string }) {
  const colsClass = COLS_CLASS[steps.length] ?? "sm:grid-cols-3";
  return (
    <div className={`relative grid gap-10 ${colsClass} sm:gap-6 ${className}`}>
      <div
        className="pointer-events-none absolute inset-x-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-ink/15 to-transparent dark:via-white/15 sm:block"
        aria-hidden="true"
      />

      {steps.map(({ icon: Icon, label, title, description }, i) => (
        <Reveal key={title} delay={i * 0.12} className="relative text-center">
          <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-sand bg-primary-700 text-white shadow-[0_10px_24px_rgba(245,158,11,0.35)] dark:border-ink">
            <Icon size={26} aria-hidden="true" />
          </div>
          <span className="mt-4 inline-block font-display text-sm font-bold uppercase tracking-[0.18em] text-primary-700">
            {label}
          </span>
          <h3 className="mt-2 font-display text-xl font-bold">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/60 dark:text-sand/60">{description}</p>
        </Reveal>
      ))}
    </div>
  );
}
