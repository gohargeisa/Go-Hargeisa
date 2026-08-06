"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { m, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Crown,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  Hotel,
  UtensilsCrossed,
  Coffee,
  Stethoscope,
  ShoppingBag,
  Building2,
  type LucideIcon,
} from "lucide-react";

import type { Locale } from "@/lib/i18n/config";
import { PrimaryButton } from "@/components/shared/buttons";

const perkKeys = ["perk1", "perk2", "perk3", "perk4", "perk5"] as const;

const trustBadgeKeys = [
  "trustFoundingPartner",
  "trustPriorityExposure",
  "trustLanguages",
  "trustOfficial",
  "trustFast",
] as const;

// Decorative glyphs for the businesses Go Hargeisa serves — purely
// ambient background motion, not tied to any translated copy.
const floatingIcons: { icon: LucideIcon; className: string; delay: number }[] = [
  { icon: Hotel, className: "top-[12%] start-[8%]", delay: 0 },
  { icon: UtensilsCrossed, className: "top-[20%] end-[10%]", delay: 1.2 },
  { icon: Coffee, className: "bottom-[26%] start-[14%]", delay: 2.1 },
  { icon: Stethoscope, className: "bottom-[14%] end-[16%]", delay: 0.6 },
  { icon: ShoppingBag, className: "top-[52%] start-[3%]", delay: 1.8 },
  { icon: Building2, className: "top-[8%] end-[28%]", delay: 2.6 },
];

// Large blurred color fields that slowly drift — the "glowing shapes"
// layer, independent of the scroll-triggered content reveals below so
// it keeps breathing for as long as the card is on screen. Gold-heavy
// this time (vs. the original emerald-led mix) since the founding-partner
// campaign leans on gold as its signature color.
const glowShapes: { className: string; drift: { x: number[]; y: number[] }; duration: number }[] = [
  { className: "-top-24 -end-20 h-80 w-80 bg-primary/35", drift: { x: [0, 24, 0], y: [0, 18, 0] }, duration: 14 },
  { className: "-bottom-28 -start-20 h-96 w-96 bg-navy-400/25", drift: { x: [0, -20, 0], y: [0, -16, 0] }, duration: 17 },
  { className: "left-1/2 top-1/4 h-72 w-72 -translate-x-1/2 bg-accent-400/20", drift: { x: [0, 16, 0], y: [0, 24, 0] }, duration: 12 },
  { className: "bottom-1/4 end-[8%] h-56 w-56 bg-primary-300/25", drift: { x: [0, -14, 0], y: [0, 12, 0] }, duration: 10 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: 0.07 * i, ease: [0.22, 1, 0.36, 1] },
  }),
};

const goldChunk = (chunks: ReactNode) => (
  <span className="bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200 bg-clip-text text-transparent">
    {chunks}
  </span>
);

/**
 * Homepage business-partnership banner — an "exclusive launch offer" for
 * the first 20 approved businesses. Links into the existing /join
 * application flow rather than duplicating it (see components/join/* for
 * the full form + trust content).
 *
 * Copy is a fixed campaign brief (badge/headline/offer/perks/notice) — do
 * not rephrase "100% Free" back in; the offer is scoped to the first 20
 * Founding Partners, not a blanket free-forever claim. Trust badges stay
 * non-numeric for the same reason the original banner did: the live
 * published-listing count is in single digits right now (see
 * lib/config/features.ts), so nothing here claims an existing partner count.
 */
export function BusinessJoinBanner({ locale }: { locale: Locale }) {
  const t = useTranslations("businessJoinBanner");
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? "show" : "hidden";

  return (
    <section className="container-px mx-auto pb-6 pt-8 md:pt-10">
      <m.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 32 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[2.75rem] bg-[radial-gradient(circle_at_15%_0%,rgba(245,158,11,0.3),transparent_45%),radial-gradient(circle_at_100%_10%,rgba(52,211,153,0.22),transparent_40%),linear-gradient(135deg,#047857_0%,#0B2D57_52%,#051427_100%)] px-6 py-16 text-center shadow-premium-lg ring-1 ring-primary-300/20 sm:px-12 sm:py-20 md:px-16 md:py-24"
      >
        {/* Glowing shapes — drift slowly and continuously, independent of
            the once-only scroll reveal on the content below. */}
        {glowShapes.map((shape, i) => (
          <m.div
            key={i}
            aria-hidden="true"
            className={`pointer-events-none absolute rounded-full blur-3xl ${shape.className}`}
            animate={reduceMotion ? undefined : { x: shape.drift.x, y: shape.drift.y }}
            transition={{ duration: shape.duration, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {!reduceMotion && (
          <div className="pointer-events-none absolute inset-0 hidden sm:block" aria-hidden="true">
            {floatingIcons.map(({ icon: Icon, className, delay }, i) => (
              <span
                key={i}
                className={`absolute animate-float text-white/15 ${className}`}
                style={{ animationDelay: `${delay}s` }}
              >
                <Icon size={36} strokeWidth={1.5} />
              </span>
            ))}
          </div>
        )}

        <div className="relative mx-auto max-w-2xl">
          <m.span
            custom={0}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative inline-flex items-center gap-2 rounded-full border border-primary-300/40 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary-200 shadow-[0_0_24px_rgba(245,158,11,0.25)] backdrop-blur-md"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-300 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-300" />
            </span>
            {t("badge")}
          </m.span>

          <m.h2
            custom={1}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mt-7 text-balance font-display text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-[2.75rem]"
          >
            {t.rich("headline", { gold: goldChunk })}
          </m.h2>

          <m.p
            custom={2}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mx-auto mt-4 max-w-lg text-balance text-base leading-7 text-white/80 sm:text-lg"
          >
            {t("description")}
          </m.p>

          {/* The main offer — deliberately the single largest, brightest
              element on the card per the campaign brief. */}
          <m.div
            custom={3}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative mx-auto mt-9 max-w-xl"
          >
            <span className="absolute inset-0 -z-10 animate-glowPulse rounded-[2rem] bg-primary/25 blur-2xl" aria-hidden="true" />
            <div className="rounded-[2rem] border border-primary-300/40 bg-white/[0.07] px-6 py-7 shadow-[0_0_50px_rgba(245,158,11,0.2)] ring-1 ring-white/10 backdrop-blur-xl sm:px-10 sm:py-8">
              <Crown size={26} strokeWidth={1.75} className="mx-auto text-primary-300" aria-hidden="true" />
              <p className="mt-3 text-balance font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl md:text-4xl">
                {t.rich("offerHeadline", {
                  free: (chunks) => (
                    <span className="animate-shimmer bg-gradient-to-r from-primary-200 via-white to-primary-200 bg-[length:200%_100%] bg-clip-text text-transparent">
                      {chunks}
                    </span>
                  ),
                  num: (chunks) => <span className="text-primary-200">{chunks}</span>,
                  partners: (chunks) => <span className="text-white">{chunks}</span>,
                })}
              </p>
            </div>
          </m.div>

          <m.div
            custom={4}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mx-auto mt-9 max-w-xl rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-6 text-start shadow-xl backdrop-blur-md sm:px-8"
          >
            <p className="text-center text-sm font-semibold uppercase tracking-wide text-primary-200">{t("perksIntro")}</p>
            <ul className="mx-auto mt-4 grid max-w-md grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {perkKeys.map((key) => (
                <li key={key} className="flex items-center gap-2.5 text-sm font-medium text-white/90">
                  <CheckCircle2 size={17} strokeWidth={2} className="shrink-0 text-primary-300" aria-hidden="true" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </m.div>

          {/* CTA hierarchy: the primary action is a large glowing filled
              pill with a hover shimmer sweep; "Learn More" is a plain text
              link underneath so it reads as secondary, not a second
              equal-weight button. */}
          <m.div
            custom={5}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mt-11 flex flex-col items-center justify-center gap-4"
          >
            <div className="relative">
              <span className="absolute inset-0 -z-10 animate-glowPulse rounded-full bg-primary/60 blur-xl" aria-hidden="true" />
              <PrimaryButton
                href={`/${locale}/join#registration-form`}
                size="lg"
                className="!relative !overflow-hidden !bg-white !px-10 !text-base !text-accent-700 shadow-[0_20px_50px_-12px_rgba(255,255,255,0.5)] hover:!bg-white/95"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent-700/10 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                />
                <span className="relative inline-flex items-center gap-2">
                  {t("ctaPrimary")}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </span>
              </PrimaryButton>
            </div>

            <Link
              href={`/${locale}/join`}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 underline-offset-4 transition-colors duration-300 hover:text-white hover:underline"
            >
              {t("ctaSecondary")}
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden="true" />
            </Link>
          </m.div>

          <m.p
            custom={6}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mt-6 text-xs font-medium text-white/55"
          >
            {t("note")}
          </m.p>

          <m.div
            custom={7}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mx-auto mt-7 flex max-w-xl flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-white/10 pt-6"
          >
            {trustBadgeKeys.map((key) => (
              <span key={key} className="inline-flex items-center gap-1 text-xs font-semibold text-white/70 sm:text-sm">
                {t(key)}
              </span>
            ))}
          </m.div>
        </div>
      </m.div>
    </section>
  );
}
