"use client";

import Image from "next/image";
import { m, useReducedMotion } from "framer-motion";
import { ChevronDown, Compass, Handshake } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
import type { Locale } from "@/lib/i18n/config";

/**
 * Single source of truth for the hero background — same swap-in-place
 * pattern as components/attractions/attractions-hero.tsx. Reuses the
 * homepage's own panoramic Hargeisa photo since no dedicated About-page
 * photo exists yet; swap this one constant for a dedicated shot later.
 */
const ABOUT_HERO_IMAGE = "/images/hero-bg.png";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function AboutHero({
  locale,
  eyebrow,
  title,
  tagline,
  subtitle,
  exploreLabel,
  contactLabel,
  scrollHint,
  localityLabel,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  /** Short supporting line rendered between the headline and the
   * description paragraph — e.g. "Discover. Connect. Book." */
  tagline?: string;
  subtitle: string;
  exploreLabel: string;
  contactLabel: string;
  scrollHint: string;
  /** "Hargeisa, Somaliland" — paired with the Somaliland flag, never the
   * Somalia flag, to keep the platform's local identity explicit. */
  localityLabel?: string;
}) {
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? "show" : "hidden";

  return (
    <section className="relative flex h-[70vh] min-h-[560px] w-full items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={ABOUT_HERO_IMAGE}
          alt="Panoramic view of Hargeisa"
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

        {tagline && (
          <m.p
            custom={1.5}
            initial={initial}
            animate="show"
            variants={fadeUp}
            className="mt-4 text-balance font-display text-lg font-semibold tracking-wide text-primary-300 sm:text-xl"
          >
            {tagline}
          </m.p>
        )}

        <m.p
          custom={2}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-5 max-w-2xl text-balance text-base leading-7 text-white/90 sm:text-lg md:text-xl"
        >
          {subtitle}
        </m.p>

        {localityLabel && (
          <m.div
            custom={2.5}
            initial={initial}
            animate="show"
            variants={fadeUp}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-md"
          >
            <Image src="/flags/somaliland.png" alt="" width={20} height={13} className="h-3.5 w-auto rounded-[2px] object-cover" />
            <span className="text-xs font-semibold text-white/85">{localityLabel}</span>
          </m.div>
        )}

        <m.div
          custom={3}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <PrimaryButton href={`/${locale}`} size="lg">
            <Compass size={18} aria-hidden="true" />
            {exploreLabel}
          </PrimaryButton>
          <SecondaryButton
            href={`/${locale}/join`}
            size="lg"
            className="border-white/40 bg-white/10 text-white backdrop-blur-md hover:border-white hover:bg-white/20 hover:text-white"
          >
            <Handshake size={18} aria-hidden="true" />
            {contactLabel}
          </SecondaryButton>
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
          <m.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown size={20} />
          </m.span>
        </m.div>
      )}
    </section>
  );
}
