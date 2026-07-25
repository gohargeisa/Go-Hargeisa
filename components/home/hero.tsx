"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  MapPin,
  Hotel as HotelIcon,
  UtensilsCrossed,
  Coffee,
} from "lucide-react";

import type { Locale } from "@/lib/i18n/config";

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

type Category = (typeof categoryCards)[number]["key"];

export function Hero({ locale }: { locale: Locale }) {
  const t = useTranslations("hero");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("hotels");

  const router = useRouter();

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/${locale}/${category}?q=${encodeURIComponent(query)}`);
  }

  return (
    <section className="relative h-screen min-h-[820px] overflow-hidden">
      <Image
        src="/images/hero-bg.png"
        alt="Panoramic view of Hargeisa at golden hour"
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-hero-gradient" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center pt-24 container-px text-center text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur-md">
          <MapPin size={13} />
          {t("eyebrow")}
        </span>

        <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.05] text-balance md:text-6xl lg:text-7xl">
          {t("title")}
        </h1>

        <p className="mt-5 max-w-xl text-base text-white/85 text-balance md:text-lg">
          {t("subtitle")}
        </p>

        <form
          onSubmit={onSearch}
          className="mt-9 w-full max-w-2xl rounded-2xl p-2 shadow-glass glass md:rounded-full"
        >
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-white/90 px-4 py-3 dark:bg-ink/70">
              <Search
                size={18}
                className="shrink-0 text-ink/50 dark:text-sand/50"
              />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/45 dark:text-sand dark:placeholder:text-sand/45"
              />
            </div>

            <button
              type="submit"
              className="shrink-0 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              {t("searchButton")}
            </button>
          </div>
        </form>

        <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
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
                  className={`group rounded-2xl border p-5 text-left backdrop-blur-xl transition-all duration-300 lg:p-6 ${
                    active
                      ? "scale-[1.02] border-white bg-white text-ink shadow-2xl ring-4 ring-white/20"
                      : "border-white/20 bg-white/15 text-white hover:-translate-y-2 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl"
                  }`}
                >
                  <div
                    className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
                      active
                        ? "bg-primary text-white"
                        : "bg-white/15 text-white"
                    }`}
                  >
                    <Icon size={28} strokeWidth={2.2} />
                  </div>

                  <h3 className="text-lg font-bold">
                    {t(titleKey)}
                  </h3>

                  <p
                    className={`mt-2 text-sm leading-relaxed ${
                      active
                        ? "text-gray-600"
                        : "text-white/75"
                    }`}
                  >
                    {t(descriptionKey)}
                  </p>
                </button>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}