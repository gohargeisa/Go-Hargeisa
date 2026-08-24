"use client";

import { m, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * One small "app notification" style card floating beside the phone mockup
 * in AppPromotionSection — a gentle, continuous vertical drift (not a
 * one-time scroll reveal like Reveal) so the section feels alive without
 * being distracting. Reduced-motion users get a static card, same
 * accessibility posture as Reveal's own useReducedMotion check.
 */
export function AppFloatingCard({
  icon,
  label,
  sublabel,
  delay = 0,
  duration = 4,
  className,
}: {
  /** A pre-rendered icon element (e.g. `<CheckCircle2 size={16} />`), not a
   * component reference — this is a Client Component, and passing a
   * component/function as a prop from a Server Component parent isn't
   * serializable across the RSC boundary. A rendered element is. */
  icon: ReactNode;
  label: ReactNode;
  sublabel?: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      initial={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.94 }}
      whileInView={
        reduceMotion
          ? undefined
          : { opacity: 1, y: [0, -8, 0], scale: 1 }
      }
      viewport={{ once: true, margin: "-60px" }}
      transition={
        reduceMotion
          ? undefined
          : {
              opacity: { duration: 0.5, delay },
              scale: { duration: 0.5, delay },
              y: { duration, delay: delay + 0.5, repeat: Infinity, ease: "easeInOut" },
            }
      }
    >
      <div className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/95 px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.25)] backdrop-blur-md dark:bg-ink/95">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
          {icon}
        </span>
        <span className="text-start leading-tight">
          <span className="block text-[13px] font-bold text-ink dark:text-white">{label}</span>
          {sublabel && <span className="block text-[11px] text-ink/55 dark:text-sand/55">{sublabel}</span>}
        </span>
      </div>
    </m.div>
  );
}
