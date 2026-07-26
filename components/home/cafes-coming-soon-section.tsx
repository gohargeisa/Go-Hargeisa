"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Coffee, Sparkles, Handshake, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/home/reveal";

const placeholderCards = [
  { key: "card1", labelKey: "cafesComingSoonCard1Label" },
  { key: "card2", labelKey: "cafesComingSoonCard2Label" },
  { key: "card3", labelKey: "cafesComingSoonCard3Label" },
] as const;

export function CafesComingSoonSection({ locale }: { locale: Locale }) {
  const t = useTranslations("home");
  const reduceMotion = useReducedMotion();

  return (
    <section className="bg-white py-16 dark:bg-white/[0.03] md:py-24">
      <div className="container-px mx-auto">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl3 border border-ink/8 bg-gradient-to-br from-primary/[0.07] via-white to-secondary/[0.06] px-6 py-14 shadow-card sm:px-10 md:px-16 md:py-20">
            <div
              className="absolute -top-20 -end-16 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-24 -start-16 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Sparkles size={13} aria-hidden="true" />
                {t("cafesComingSoonBadge")}
              </span>

              <h2 className="mt-6 text-balance font-display text-3xl font-bold text-ink sm:text-4xl md:text-5xl">
                {t("cafesComingSoonTitle")}
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-balance leading-7 text-ink/60 md:text-lg">
                {t("cafesComingSoonDescription")}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={`/${locale}/contact`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-[0_12px_28px_rgba(245,158,11,0.35)] sm:w-auto"
                >
                  <Handshake size={16} aria-hidden="true" />
                  {t("cafesComingSoonPartnerButton")}
                </Link>
                <Link
                  href={`/${locale}/hotels`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-6 py-3 text-sm font-semibold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary sm:w-auto"
                >
                  {t("cafesComingSoonExploreButton")}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="relative mt-14 grid gap-6 sm:grid-cols-3">
              {placeholderCards.map(({ key, labelKey }) => (
                <motion.div
                  key={key}
                  whileHover={reduceMotion ? undefined : { y: -8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="group relative flex flex-col overflow-hidden rounded-[28px] border border-ink/8 bg-white shadow-[0_8px_24px_rgba(20,30,45,0.07)] transition-shadow duration-300 hover:border-primary/25 hover:shadow-[0_28px_60px_rgba(20,30,45,0.16)]"
                >
                  <div className="relative h-48 overflow-hidden rounded-t-[28px] bg-gradient-to-br from-primary/25 via-secondary/15 to-secondary/5 sm:h-52">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Coffee
                        size={44}
                        strokeWidth={1.5}
                        className="text-secondary-700/40 transition-transform duration-700 ease-out group-hover:scale-110"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="absolute start-3.5 top-3.5 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm ring-1 ring-white/30 backdrop-blur-md">
                      <Sparkles size={10} aria-hidden="true" />
                      {t("cafesComingSoonBadge")}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-6 sm:p-7">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                      {t(labelKey)}
                    </span>
                    <p className="flex-1 text-sm leading-relaxed text-ink/60">
                      {t("cafesComingSoonCardText")}
                    </p>
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      title={t("cafesComingSoonBadge")}
                      className="mt-3 inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-full border border-ink/10 bg-ink/5 px-4 text-sm font-semibold text-ink/40"
                    >
                      {t("cafesComingSoonViewDetails")}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
