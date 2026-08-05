"use client";

import { m, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Reveal } from "@/components/home/reveal";

/**
 * Spring hover-lift wrapper — dedupes the identical
 * `m.div whileHover={{y:-N}} transition={{type:"spring",...}}` pattern
 * hand-rolled in hotel-card.tsx, cafe-card.tsx, listing-card.tsx and
 * service-card.tsx. Scroll-reveal is opt-in via `reveal` (default off)
 * since grids of these cards are usually already wrapped in a single
 * page-level <Reveal> — enabling it here too would add a Reveal observer
 * per card for no visual benefit.
 */
export function AnimatedCard({
  children,
  className = "",
  lift = 8,
  reveal = false,
  revealDelay = 0,
}: {
  children: ReactNode;
  className?: string;
  lift?: number;
  reveal?: boolean;
  revealDelay?: number;
}) {
  const reduceMotion = useReducedMotion();

  const card = (
    <m.div
      whileHover={reduceMotion ? undefined : { y: -lift }}
      // A hover-only lift is a desktop-first signal that never fires on a
      // touchscreen tap — whileTap gives every card built on this component
      // (12 call sites: listing/hotel/cafe/service/city-service cards, all
      // 5 homepage "premium" card variants, attraction-card) a genuine
      // spring press-down instead of feeling dead on tap, which is exactly
      // the class of thing that reads as "website in a WebView."
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={className}
    >
      {children}
    </m.div>
  );

  return reveal ? <Reveal delay={revealDelay}>{card}</Reveal> : card;
}
