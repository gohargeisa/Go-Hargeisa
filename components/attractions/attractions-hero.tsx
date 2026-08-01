"use client";

import Image from "next/image";
import { m, useReducedMotion } from "framer-motion";
import { ChevronDown, Compass, MapPin } from "lucide-react";
import { PrimaryButton } from "@/components/shared/buttons";

/**
 * Single source of truth for the hero background — swap this one constant
 * for a dedicated attraction photo later (e.g. "/images/heroes/attractions-hero.jpg")
 * without touching any layout/markup below. Reuses the homepage's own
 * panoramic Hargeisa photo in the meantime instead of a placeholder.
 */
const ATTRACTIONS_HERO_IMAGE = "/images/hero-bg.png";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function AttractionsHero({
  eyebrow,
  title,
  subtitle,
  exploreLabel,
  scrollHint,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  exploreLabel: string;
  scrollHint: string;
}) {
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? "show" : "hidden";

  return (
    <section className="relative flex h-[70vh] min-h-[560px] w-full items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={ATTRACTIONS_HERO_IMAGE}
          alt="Panoramic view of Hargeisa"
          fill
          priority
          sizes="100vw"
          className={`object-cover ${reduceMotion ? "" : "animate-kenburns"}`}
        />
      </div>

      {/* Dark gradient overlay for text readability over any photo */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-ink/80" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      <div className="container-px relative z-10 mx-auto flex w-full flex-col items-center text-center text-white">
        <m.span
          custom={0}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] backdrop-blur-md"
        >
          <MapPin size={13} aria-hidden="true" />
          {eyebrow}
        </m.span>

        <m.h1
          custom={1}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-6 text-balance font-display text-4xl font-bold leading-[1.05] drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {title}
        </m.h1>

        <m.p
          custom={2}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-5 max-w-2xl text-balance text-base leading-7 text-white/90 sm:text-lg md:text-xl"
        >
          {subtitle}
        </m.p>

        <m.div
          custom={3}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <PrimaryButton href="#attractions-grid" size="lg">
            <Compass size={18} aria-hidden="true" />
            {exploreLabel}
          </PrimaryButton>
        </m.div>
      </div>

      {!reduceMotion && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1.5 text-white/80"
          aria-hidden="true"
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.2em]">{scrollHint}</span>
          <m.span
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={20} />
          </m.span>
        </m.div>
      )}
    </section>
  );
}
