"use client";

import Image from "next/image";
import { m, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";

export interface PremiumHeroAction {
  label: string;
  href: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] },
  }),
};

/**
 * Shared cinematic page hero — generalizes the pattern first built for
 * components/attractions/attractions-hero.tsx and components/about/about-hero.tsx
 * (70vh photo + dark gradient overlay + Framer Motion fade-in + optional
 * scroll hint) into one reusable component for every other public page,
 * replacing the old flat components/shared/page-hero.tsx.
 *
 * Deliberately takes only strings/hrefs, never icon components, as props:
 * this is a "use client" component and pages that render it are Server
 * Components — a Lucide icon (a function) can't be passed as a prop across
 * that boundary (React can only serialize plain data there).
 */
export function PremiumPageHero({
  image,
  imageAlt,
  eyebrow,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  scrollHint,
}: {
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  primaryAction?: PremiumHeroAction;
  secondaryAction?: PremiumHeroAction;
  scrollHint?: string;
}) {
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? "show" : "hidden";

  return (
    <section className="relative flex h-[70vh] min-h-[560px] w-full items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className={`object-cover ${reduceMotion ? "" : "animate-kenburns"}`}
        />
      </div>

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

        {subtitle && (
          <m.p
            custom={2}
            initial={initial}
            animate="show"
            variants={fadeUp}
            className="mt-5 max-w-2xl text-balance text-base leading-7 text-white/90 sm:text-lg md:text-xl"
          >
            {subtitle}
          </m.p>
        )}

        {(primaryAction || secondaryAction) && (
          <m.div
            custom={3}
            initial={initial}
            animate="show"
            variants={fadeUp}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          >
            {primaryAction && (
              <PrimaryButton href={primaryAction.href} size="lg">
                {primaryAction.label}
              </PrimaryButton>
            )}
            {secondaryAction && (
              <SecondaryButton
                href={secondaryAction.href}
                size="lg"
                className="border-white/40 bg-white/10 text-white backdrop-blur-md hover:border-white hover:bg-white/20 hover:text-white"
              >
                {secondaryAction.label}
              </SecondaryButton>
            )}
          </m.div>
        )}
      </div>

      {scrollHint && !reduceMotion && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1.5 text-white/80"
          aria-hidden="true"
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.2em]">{scrollHint}</span>
          <m.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown size={20} />
          </m.span>
        </m.div>
      )}
    </section>
  );
}
