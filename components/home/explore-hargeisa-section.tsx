"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Fuel, MoonStar, Pill, ShoppingCart, Sparkles, Stethoscope, X, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { SERVICES_PUBLIC_ENABLED } from "@/lib/config/features";

const TOAST_DURATION_MS = 4500;

// hospital/pharmacy/gas_station only get a real `href` (instead of the
// "coming soon" toast) while Services is publicly enabled — see
// lib/config/features.ts. Flipping that flag back restores these links
// with no other changes needed here.
const CARDS: {
  category: string;
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  gradient: string;
  href?: string;
}[] = [
  {
    category: "hospital",
    icon: Stethoscope,
    titleKey: "exploreHargeisaHospitalsTitle",
    descriptionKey: "exploreHargeisaHospitalsDescription",
    gradient: "from-red-600/70 via-red-900/60 to-ink",
    href: SERVICES_PUBLIC_ENABLED ? "/services/hospitals" : undefined,
  },
  {
    category: "pharmacy",
    icon: Pill,
    titleKey: "exploreHargeisaPharmaciesTitle",
    descriptionKey: "exploreHargeisaPharmaciesDescription",
    gradient: "from-pink-600/70 via-fuchsia-900/60 to-ink",
    href: SERVICES_PUBLIC_ENABLED ? "/services/pharmacies" : undefined,
  },
  {
    category: "gas_station",
    icon: Fuel,
    titleKey: "exploreHargeisaGasStationsTitle",
    descriptionKey: "exploreHargeisaGasStationsDescription",
    gradient: "from-orange-600/70 via-amber-900/60 to-ink",
    href: SERVICES_PUBLIC_ENABLED ? "/services/gas-stations" : undefined,
  },
  {
    category: "supermarket",
    icon: ShoppingCart,
    titleKey: "exploreHargeisaSupermarketsTitle",
    descriptionKey: "exploreHargeisaSupermarketsDescription",
    gradient: "from-violet-600/70 via-purple-900/60 to-ink",
  },
  {
    category: "mosque",
    icon: MoonStar,
    titleKey: "exploreHargeisaMosquesTitle",
    descriptionKey: "exploreHargeisaMosquesDescription",
    gradient: "from-teal-600/70 via-emerald-900/60 to-ink",
  },
];

export function ExploreHargeisaSection({ locale }: { locale: string }) {
  const t = useTranslations("home");
  const reduceMotion = useReducedMotion();
  const [toastOpen, setToastOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function openToast() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToastOpen(true);
    timeoutRef.current = setTimeout(() => setToastOpen(false), TOAST_DURATION_MS);
  }

  function closeToast() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToastOpen(false);
  }

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
            {CARDS.map(({ category, icon: Icon, titleKey, descriptionKey, gradient, href }) => {
              const cardClassName =
                "group flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-ink/8 bg-white text-start shadow-[0_8px_24px_rgba(20,30,45,0.07)] transition-shadow duration-300 hover:border-primary/25 hover:shadow-[0_28px_60px_rgba(20,30,45,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-white/[0.04] dark:hover:shadow-[0_28px_60px_rgba(0,0,0,0.45)]";
              const cardContent = (
                <>
                  <div className="relative h-64 shrink-0 overflow-hidden rounded-t-[28px] sm:h-[17rem]">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-700 ease-out group-hover:scale-110`}
                      aria-hidden="true"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon
                        size={52}
                        strokeWidth={1.5}
                        className="text-white/30 transition-transform duration-700 ease-out group-hover:scale-110"
                        aria-hidden="true"
                      />
                    </div>
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent"
                      aria-hidden="true"
                    />
                    {!href && (
                      <span className="absolute start-3.5 top-3.5 z-10 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(245,158,11,0.45)] ring-1 ring-white/30 backdrop-blur-md">
                        <Sparkles size={10} aria-hidden="true" />
                        {t("exploreHargeisaComingSoonBadge")}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-6 sm:p-7">
                    <h3 className="font-display text-lg font-bold text-ink dark:text-white">{t(titleKey)}</h3>
                    <p className="flex-1 text-sm leading-relaxed text-ink/60 dark:text-sand/60">
                      {t(descriptionKey)}
                    </p>
                  </div>
                </>
              );

              if (href) {
                return (
                  <m.div
                    key={category}
                    whileHover={reduceMotion ? undefined : { y: -8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  >
                    <Link href={`/${locale}${href}`} className={cardClassName}>
                      {cardContent}
                    </Link>
                  </m.div>
                );
              }

              return (
                <m.button
                  key={category}
                  type="button"
                  onClick={openToast}
                  whileHover={reduceMotion ? undefined : { y: -8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className={cardClassName}
                >
                  {cardContent}
                </m.button>
              );
            })}
          </div>
        </Reveal>
      </div>

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4"
      >
        <AnimatePresence>
          {toastOpen && (
            <m.div
              role="status"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl border border-white/10 bg-ink px-5 py-4 text-sm text-white shadow-2xl dark:border-white/15 dark:bg-white dark:text-ink"
            >
              <Sparkles size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <p className="flex-1 leading-relaxed">{t("exploreHargeisaComingSoonToast")}</p>
              <button
                type="button"
                onClick={closeToast}
                aria-label={t("exploreHargeisaComingSoonDismiss")}
                className="shrink-0 rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white dark:text-ink/50 dark:hover:bg-ink/10 dark:hover:text-ink"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
