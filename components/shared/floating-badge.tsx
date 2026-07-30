import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Position = "top-start" | "top-end" | "bottom-start" | "bottom-end";

const POSITION_CLASS: Record<Position, string> = {
  "top-start": "start-3.5 top-3.5",
  "top-end": "end-3.5 top-3.5",
  "bottom-start": "start-3.5 bottom-3.5",
  "bottom-end": "end-3.5 bottom-3.5",
};

/**
 * Small pill badge that floats over a photo/hero — dedupes the
 * byte-identical "featured" badge string previously hand-typed in both
 * hotel-card.tsx and explore-hargeisa-section.tsx.
 */
export function FloatingBadge({
  icon: Icon,
  children,
  position = "top-start",
  className = "",
}: {
  icon?: LucideIcon;
  children: ReactNode;
  position?: Position;
  className?: string;
}) {
  return (
    <span
      className={`absolute ${POSITION_CLASS[position]} z-10 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(245,158,11,0.45)] ring-1 ring-white/30 backdrop-blur-md ${className}`}
    >
      {Icon && <Icon size={10} aria-hidden="true" />}
      {children}
    </span>
  );
}
