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

// Tiny twinkling highlights — cheap CSS-only opacity pulses, not JS
// animation loops, so this stays a light touch rather than a busy effect.
const particles: { top: string; left: string; delay: number }[] = [
  { top: "16%", left: "20%", delay: 0 },
  { top: "30%", left: "80%", delay: 0.9 },
  { top: "58%", left: "10%", delay: 1.8 },
  { top: "72%", left: "88%", delay: 0.5 },
  { top: "46%", left: "50%", delay: 1.3 },
  { top: "85%", left: "38%", delay: 2.2 },
];

// Inline SVG grain — a static data-URI tile blended with `overlay`, cheap
// (one small image, no JS) and the standard way to add "premium noise"
// texture without shipping a raster asset.
const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] },
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
 * Founding Partners, not a blanket free-forever claim. The "Only 20
 * Businesses" scarcity label and QR card are static — no live counter or
 * countdown, since there's no real signup data behind either.
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
        className="relative overflow-hidden rounded-[2.75rem] bg-[radial-gradient(circle_at_15%_0%,rgba(245,158,11,0.3),transparent_45%),radial-gradient(circle_at_100%_10%,rgba(52,211,153,0.22),transparent_40%),linear-gradient(135deg,#047857_0%,#0B2D57_52%,#051427_100%)] px-6 py-16 text-center shadow-premium-lg ring-1 ring-primary-300/20 sm:px-12 sm:py-20 md:px-16 md:py-28"
      >
        {/* Very subtle grid — a classic "premium SaaS hero" texture cue. */}
        <div
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:36px_36px]"
          aria-hidden="true"
        />

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

        {/* Grain overlay for depth — static, blended over the gradient. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{ backgroundImage: NOISE_BG }}
          aria-hidden="true"
        />

        {/* A soft diagonal light band standing in for a glass reflection. */}
        <div
          className="pointer-events-none absolute -inset-y-16 left-[-15%] w-1/3 rotate-[10deg] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
          aria-hidden="true"
        />

        {!reduceMotion &&
          particles.map((p, i) => (
            <span
              key={i}
              className="pointer-events-none absolute h-1 w-1 rounded-full bg-primary-200 shadow-[0_0_6px_2px_rgba(245,197,106,0.55)] animate-pulse"
              style={{ top: p.top, left: p.left, animationDelay: `${p.delay}s`, animationDuration: "3.2s" }}
              aria-hidden="true"
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
          <m.h2
            custom={0}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-balance font-display text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-[2.75rem]"
          >
            {t.rich("headline", { gold: goldChunk })}
          </m.h2>

          <m.p
            custom={1}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mx-auto mt-5 max-w-lg text-balance text-base leading-7 text-white/80 sm:text-lg"
          >
            {t("description")}
          </m.p>

          {/* Scarcity label — plain static copy, no live counter. */}
          <m.span
            custom={2}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mt-8 inline-flex items-center gap-1.5 rounded-full border border-primary-300/50 bg-gradient-to-r from-primary-400/25 via-primary-300/20 to-primary-400/25 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary-100 shadow-[0_0_22px_rgba(245,158,11,0.35)]"
          >
            {t("scarcityLabel")}
          </m.span>

          {/* The main offer — deliberately the single largest, brightest
              element on the card, with FREE as the clear focal point. */}
          <m.div
            custom={3}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative mx-auto mt-4 max-w-xl"
          >
            <span className="absolute inset-0 -z-10 animate-glowPulse rounded-[2rem] bg-primary/25 blur-2xl" aria-hidden="true" />
            <div className="rounded-[2rem] border border-primary-300/40 bg-white/[0.07] px-6 py-9 shadow-[0_0_60px_rgba(245,158,11,0.22)] ring-1 ring-white/10 backdrop-blur-xl sm:px-10 sm:py-12">
              <Crown size={28} strokeWidth={1.75} className="mx-auto text-primary-300" aria-hidden="true" />
              <div className="mt-4 flex flex-col items-center gap-1.5">
                <span className="animate-shimmer bg-gradient-to-r from-primary-200 via-white to-primary-200 bg-[length:200%_100%] bg-clip-text font-display text-6xl font-black leading-none tracking-tight text-transparent sm:text-7xl md:text-8xl">
                  {t("offerFree")}
                </span>
                <span className="mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-primary-200/90 sm:text-base">
                  {t("offerFor")}
                </span>
                <span className="mt-1 text-balance font-display text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
                  {t("offerPartners")}
                </span>
              </div>
            </div>
          </m.div>

          <m.div
            custom={4}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mx-auto mt-12 max-w-xl rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-6 text-start shadow-xl backdrop-blur-md sm:px-8"
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

          {/* CTA hierarchy: the primary action is a large glowing gold pill
              with a hover shine sweep and lift; "Learn More" is a plain
              text link underneath so it reads as clearly secondary. */}
          <m.div
            custom={5}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mt-14 flex flex-col items-center justify-center gap-4"
          >
            <div className="relative">
              <span className="absolute inset-0 -z-10 animate-glowPulse rounded-full bg-[#F4B942]/60 blur-xl" aria-hidden="true" />
              <PrimaryButton
                href={`/${locale}/join#registration-form`}
                size="lg"
                className="!relative !overflow-hidden !border-0 !bg-gradient-to-r !from-[#FFD56A] !via-[#F4B942] !to-[#D89E2F] !px-11 !py-4 !text-base !font-bold !text-navy-900 shadow-[0_20px_50px_-12px_rgba(244,185,66,0.65)] transition-all duration-300 ease-premium hover:-translate-y-1 hover:scale-[1.03] hover:!shadow-[0_26px_60px_-10px_rgba(244,185,66,0.8)]"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
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

          {/* QR card — glass panel, static SVG (public/images/join-qr.svg),
              no next/image since local SVGs need dangerouslyAllowSVG. */}
          <m.div
            custom={6}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mx-auto mt-8 flex w-fit items-center gap-4 rounded-2xl border border-white/15 bg-white/[0.07] p-4 shadow-xl backdrop-blur-xl transition-transform duration-300 ease-premium hover:scale-[1.03] sm:gap-5 sm:p-5"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 sm:h-20 sm:w-20">
              <img src="/images/join-qr.svg" alt="" width={80} height={80} className="h-full w-full" aria-hidden="true" />
            </div>
            <div className="text-start">
              <p className="text-sm font-bold text-white">{t("qrLabel")}</p>
              <p className="mt-0.5 text-xs font-medium text-primary-200">gohargeisa.com/join</p>
            </div>
          </m.div>

          <m.p
            custom={7}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mt-6 text-xs font-medium text-white/55"
          >
            {t("note")}
          </m.p>

          <m.div
            custom={8}
            initial={initial}
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mx-auto mt-10 flex max-w-xl flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-white/10 pt-7"
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
