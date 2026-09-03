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

  // `animate` is ALWAYS the resting state — never `undefined`. On the server
  // `useReducedMotion()` is null, so `initial={{opacity:0}}` is rendered as
  // an inline style; if the client then resolves `reduceMotion` to true and
  // `animate` were `undefined`, framer would leave that inline `opacity:0`
  // in place and the whole page would stay invisible for anyone with
  // "reduce motion" enabled. Keeping `animate` fixed and only dropping the
  // *entrance* (initial:false + zero-duration) fixes that.
  return (
    <m.div
      key={pathname}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </m.div>
  );
}
