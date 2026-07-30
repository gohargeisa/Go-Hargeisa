import type { HTMLAttributes, ReactNode } from "react";

type Tone = "light" | "dark";
type Blur = "sm" | "md" | "xl";

const TONE_CLASS: Record<Tone, string> = {
  light: "border-white/30 bg-white/20 text-white",
  dark: "border-white/10 bg-ink/50 text-white",
};

const BLUR_CLASS: Record<Blur, string> = {
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  xl: "backdrop-blur-xl",
};

/**
 * Formalizes the `.glass`/`.glass-dark` utilities in globals.css into a real
 * component with explicit tone/blur props. Glass only reads visually over a
 * colored or photographic backdrop (see glass-stat-card.tsx) — this is meant
 * for hero overlays, floating panels on photos, and gradient CTA sections,
 * not for cards sitting on a plain white page background.
 */
export function GlassCard({
  children,
  tone = "light",
  blur = "xl",
  className = "",
  ...rest
}: {
  children: ReactNode;
  tone?: Tone;
  blur?: Blur;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border ${TONE_CLASS[tone]} ${BLUR_CLASS[blur]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
