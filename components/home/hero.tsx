"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { m, useReducedMotion } from "framer-motion";
import {
  Search,
  MapPin,
  Hotel as HotelIcon,
  UtensilsCrossed,
  Coffee,
} from "lucide-react";

import type { Locale } from "@/lib/i18n/config";
import { useSearchOverlay } from "@/components/shared/search-overlay-provider";
import { HeroBackground } from "@/components/home/hero-background";

const categoryCards = [
  {
    key: "hotels",
    icon: HotelIcon,
    titleKey: "hotelCardTitle",
    descriptionKey: "hotelCardDescription",
  },
  {
    key: "restaurants",
    icon: UtensilsCrossed,
    titleKey: "restaurantCardTitle",
    descriptionKey: "restaurantCardDescription",
  },
  {
    key: "cafes",
    icon: Coffee,
    titleKey: "cafeCardTitle",
    descriptionKey: "cafeCardDescription",
  },
] as const;

const highlightPills = [
  { emoji: "🏨", labelKey: "highlightHotels" },
  { emoji: "🍽", labelKey: "highlightRestaurants" },
  { emoji: "☕", labelKey: "highlightCafes" },
  { emoji: "📍", labelKey: "highlightAttractions" },
  { emoji: "🎉", labelKey: "highlightEvents" },
] as const;

type Category = (typeof categoryCards)[number]["key"];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Hero({ locale }: { locale: Locale }) {
  const t = useTranslations("hero");
  const reduceMotion = useReducedMotion();
  const searchInputId = useId();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("hotels");

  const router = useRouter();
  const { open: openSearchOverlay } = useSearchOverlay();

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/${locale}/${category}?q=${encodeURIComponent(query)}`);
  }

  const initial = reduceMotion ? "show" : "hidden";

  return (
    <section className="relative flex min-h-[720px] h-auto items-start overflow-hidden pb-12 md:h-screen md:max-h-[980px] md:pb-0 md:items-center lg:h-auto lg:min-h-screen lg:max-h-none">
      <HeroBackground reduceMotion={!!reduceMotion} priority />

      <div className="container-px relative z-10 mx-auto flex w-full flex-col items-center pt-24 text-center text-white sm:pt-28 md:pt-16 lg:min-w-0 lg:pt-24 lg:pb-8">
        <m.span
          custom={0}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-gradient-to-r from-primary-500/25 via-white/10 to-primary-500/25 px-4 py-1.5 text-xs font-bold tracking-wide text-white shadow-[0_8px_24px_rgba(245,158,11,0.25)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_12px_32px_rgba(245,158,11,0.35)]"
        >
          <span aria-hidden="true">🥇</span>
          {t("premiumBadge")}
        </m.span>

        <m.span
          custom={1}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur-md"
        >
          <MapPin size={13} aria-hidden="true" />
          {t("eyebrow")}
        </m.span>

        <m.h1
          custom={2}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-6 max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.08] sm:text-5xl md:text-6xl lg:text-[5.25rem] lg:leading-[1.03] lg:break-words"
        >
          {t("title")}
        </m.h1>

        <m.p
          custom={3}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-4 max-w-2xl text-balance font-display text-lg font-semibold text-white/95 sm:text-xl md:text-2xl lg:mt-3"
        >
          {t("positioning")}
        </m.p>

        <m.p
          custom={4}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-4 max-w-xl text-balance text-base text-white/85 md:text-lg lg:mt-3"
        >
          {t("subtitle")}
        </m.p>

        <m.div
          custom={5}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 lg:mt-4"
        >
          {highlightPills.map(({ emoji, labelKey }) => (
            <span
              key={labelKey}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20"
            >
              <span aria-hidden="true">{emoji}</span>
              {t(labelKey)}
            </span>
          ))}
        </m.div>

        <m.div
          custom={6}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="glass mt-8 w-full max-w-2xl rounded-2xl p-2 shadow-[0_20px_60px_rgba(0,0,0,0.25)] ring-1 ring-white/15 backdrop-saturate-150 sm:mt-9 md:rounded-full lg:mt-4"
        >
          {/* Mobile/tablet: tapping opens the full-screen native search
              takeover (components/shared/global-search.tsx) instead of this
              hero owning its own text field — matches the header search
              icon and bottom-nav Explore tab, which open the same overlay. */}
          <button
            type="button"
            onClick={openSearchOverlay}
            className="flex w-full items-center gap-2.5 rounded-full bg-white/95 px-5 py-3.5 text-start transition-transform active:scale-[0.98] dark:bg-ink/70 lg:hidden"
          >
            <Search size={19} aria-hidden="true" className="shrink-0 text-ink/50 dark:text-sand/50" />
            <span className="truncate text-[15px] text-ink/45 dark:text-sand/45">{t("searchPlaceholder")}</span>
          </button>

          {/* Desktop: existing category-scoped inline search stays as-is —
              there's no anchored header dropdown positioned near the hero
              to hand off to at this breakpoint. */}
          <form onSubmit={onSearch} role="search" aria-label={t("searchButton")} className="hidden lg:flex lg:flex-row lg:gap-2">
            <div className="flex flex-1 items-center gap-2.5 rounded-full bg-white/95 px-5 py-3.5 dark:bg-ink/70">
              <Search
                size={19}
                aria-hidden="true"
                className="shrink-0 text-ink/50 dark:text-sand/50"
              />

              <label htmlFor={searchInputId} className="sr-only">
                {t("searchPlaceholder")}
              </label>
              <input
                id={searchInputId}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink/45 dark:text-sand dark:placeholder:text-sand/45"
              />
            </div>

            <button
              type="submit"
              className="shrink-0 rounded-full bg-primary-700 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(245,158,11,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-[0_12px_28px_rgba(245,158,11,0.45)] active:translate-y-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t("searchButton")}
            </button>
          </form>
        </m.div>

        <m.div
          custom={7}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-4 md:mt-12 md:grid-cols-3 lg:mt-4"
        >
          {categoryCards.map(
            ({ key, icon: Icon, titleKey, descriptionKey }) => {
              const active = category === key;

              return (
                <button
                  key={key}
                  type="button"
                  aria-label={t(titleKey)}
                  aria-pressed={active}
                  onClick={() => setCategory(key)}
                  className={`group rounded-2xl border p-5 text-start backdrop-blur-xl transition-all duration-300 active:scale-[0.97] lg:p-4 ${
                    active
                      ? "scale-[1.02] border-white bg-white text-ink shadow-2xl ring-4 ring-white/20"
                      : "border-white/20 bg-white/15 text-white hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl"
                  }`}
                >
                  <div
                    className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 lg:mb-2 lg:h-11 lg:w-11 ${
                      active
                        ? "bg-primary text-white"
                        : "bg-white/15 text-white"
                    }`}
                  >
                    <Icon size={28} strokeWidth={2.2} aria-hidden="true" />
                  </div>

                  {/* Not a heading — this is a button caption (the button
                      already has an equivalent aria-label above), and a
                      fixed heading level here would skip past the hero's
                      own h1 with nothing in between (axe heading-order). */}
                  <p className="text-lg font-bold">{t(titleKey)}</p>

                  <p
                    className={`mt-2 text-sm leading-relaxed ${
                      active ? "text-gray-600" : "text-white/75"
                    }`}
                  >
                    {t(descriptionKey)}
                  </p>
                </button>
              );
            }
          )}
        </m.div>
      </div>
    </section>
  );
}
