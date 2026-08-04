"use client";

import { m, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Best-effort route-change transition — a fade + slight rise on the
 * *entering* page, keyed by pathname so React treats each route as a fresh
 * element. Deliberately not an AnimatePresence exit/enter pair: Next's App
 * Router replaces the RSC payload before an exit animation would have a
 * chance to coexist with the incoming page the way a true SPA route can, so
 * chasing a coordinated exit here would be fighting the framework for a
 * transition that would look janky more often than not. The enter half is
 * what actually reads as "native" — see Reveal (components/home/reveal.tsx)
 * for the same reduced-motion/easing convention used everywhere else.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      key={pathname}
      initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </m.div>
  );
}
