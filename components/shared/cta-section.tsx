import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal } from "@/components/home/reveal";
import { AnimatedBackground } from "./animated-background";

/**
 * Gradient CTA panel — generalizes the near-identical implementations in
 * join-final-cta.tsx, newsletter-section.tsx and coming-soon-section.tsx
 * (rounded gradient card + two blurred blobs + centered eyebrow/icon/title/
 * subtitle + an action slot) into one component with a dark/light tone.
 * The action area (buttons, a form, whatever) is passed as children so
 * this stays content-agnostic.
 */
export function CTASection({
  tone = "dark",
  eyebrow,
  icon: Icon,
  title,
  subtitle,
  children,
  className = "",
  radiusClassName = "rounded-xl3",
  blobs,
}: {
  tone?: "dark" | "light";
  eyebrow?: string;
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  radiusClassName?: string;
  blobs?: string[];
}) {
  const dark = tone === "dark";

  return (
    <Reveal>
      <div
        className={`relative overflow-hidden ${radiusClassName} px-6 py-14 text-center shadow-card sm:px-10 md:px-16 md:py-16 ${
          dark
            ? "bg-gradient-to-br from-primary via-primary-700 to-secondary-700 text-white"
            : "border border-ink/8 bg-gradient-to-br from-primary/[0.07] via-white to-secondary/[0.06]"
        } ${className}`}
      >
        <AnimatedBackground variant={dark ? "dark" : "light"} blobs={blobs} />

        <div className="relative mx-auto max-w-xl">
          {eyebrow && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${
                dark ? "border-white/25 bg-white/10 text-white" : "border-primary/20 bg-primary/10 text-primary"
              }`}
            >
              {eyebrow}
            </span>
          )}

          {Icon && (
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${eyebrow ? "mt-6" : ""} ${
                dark ? "bg-white/15" : "bg-primary/10 text-primary"
              }`}
            >
              <Icon size={28} strokeWidth={1.75} aria-hidden="true" />
            </div>
          )}

          <h2 className={`text-balance font-display text-3xl font-bold sm:text-4xl ${eyebrow || Icon ? "mt-6" : ""}`}>
            {title}
          </h2>

          {subtitle && (
            <p className={`mx-auto mt-4 max-w-lg text-balance leading-7 sm:text-lg ${dark ? "text-white/85" : "text-ink/60"}`}>
              {subtitle}
            </p>
          )}

          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </Reveal>
  );
}
