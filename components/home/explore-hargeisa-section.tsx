"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Fuel, MoonStar, Pill, ShoppingCart, Stethoscope, type LucideIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { CityServicePoint } from "@/types";
import { Reveal } from "@/components/home/reveal";
import { CityMapLoader } from "@/components/map/city-map-loader";

const CARDS: {
  category: string;
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  tone: string;
}[] = [
  {
    category: "hospital",
    icon: Stethoscope,
    titleKey: "exploreHargeisaHospitalsTitle",
    descriptionKey: "exploreHargeisaHospitalsDescription",
    tone: "bg-red-100 text-red-600 dark:bg-red-400/15 dark:text-red-300",
  },
  {
    category: "pharmacy",
    icon: Pill,
    titleKey: "exploreHargeisaPharmaciesTitle",
    descriptionKey: "exploreHargeisaPharmaciesDescription",
    tone: "bg-pink-100 text-pink-600 dark:bg-pink-400/15 dark:text-pink-300",
  },
  {
    category: "gas_station",
    icon: Fuel,
    titleKey: "exploreHargeisaGasStationsTitle",
    descriptionKey: "exploreHargeisaGasStationsDescription",
    tone: "bg-orange-100 text-orange-600 dark:bg-orange-400/15 dark:text-orange-300",
  },
  {
    category: "supermarket",
    icon: ShoppingCart,
    titleKey: "exploreHargeisaSupermarketsTitle",
    descriptionKey: "exploreHargeisaSupermarketsDescription",
    tone: "bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
  },
  {
    category: "mosque",
    icon: MoonStar,
    titleKey: "exploreHargeisaMosquesTitle",
    descriptionKey: "exploreHargeisaMosquesDescription",
    tone: "bg-teal-100 text-teal-600 dark:bg-teal-400/15 dark:text-teal-300",
  },
];

export function ExploreHargeisaSection({
  locale,
  points,
}: {
  locale: Locale;
  points: CityServicePoint[];
}) {
  const t = useTranslations("home");
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-16 md:py-24">
      <div className="container-px mx-auto">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {t("exploreHargeisaEyebrow")}
            </span>
            <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("exploreHargeisaTitle")}
            </h2>
            <p className="mt-3 text-ink/60 dark:text-sand/60">{t("exploreHargeisaSubtitle")}</p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 md:mt-14 lg:grid-cols-5">
            {CARDS.map(({ category, icon: Icon, titleKey, descriptionKey, tone }) => (
              <motion.div
                key={category}
                whileHover={reduceMotion ? undefined : { y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="h-full"
              >
                <Link
                  href={`/${locale}/city-map?category=${category}`}
                  className="group flex h-full flex-col rounded-[28px] border border-ink/8 bg-white p-6 shadow-[0_8px_24px_rgba(20,30,45,0.07)] transition-shadow duration-300 hover:border-primary/25 hover:shadow-[0_28px_60px_rgba(20,30,45,0.16)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:shadow-[0_28px_60px_rgba(0,0,0,0.45)]"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tone}`}
                    aria-hidden="true"
                  >
                    <Icon size={26} strokeWidth={1.75} />
                  </div>

                  <h3 className="mt-5 font-display text-lg font-bold text-ink dark:text-white">
                    {t(titleKey)}
                  </h3>

                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/60 dark:text-sand/60">
                    {t(descriptionKey)}
                  </p>

                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    {t("exploreHargeisaExplore")}
                    <ArrowRight
                      size={15}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-14 md:mt-20">
            <h3 className="text-center font-display text-2xl font-bold md:text-3xl">
              {t("exploreHargeisaMapTitle")}
            </h3>

            <div className="mx-auto mt-6 h-[420px] w-full overflow-hidden rounded-xl3 border border-ink/8 shadow-card dark:border-white/10">
              <CityMapLoader points={points} onSelectPoint={() => {}} />
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                href={`/${locale}/city-map`}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(245,158,11,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-[0_14px_30px_rgba(245,158,11,0.4)]"
              >
                {t("exploreHargeisaOpenMap")}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
