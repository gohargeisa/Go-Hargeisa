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
  CalendarDays,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

const categories = [
  { key: "hotels", icon: HotelIcon },
  { key: "restaurants", icon: UtensilsCrossed },
  { key: "cafes", icon: Coffee },
  { key: "events", icon: CalendarDays },
] as const;

export function Hero({ locale }: { locale: Locale }) {
  const t = useTranslations("hero");
  const nav = useTranslations("nav");

  const [query, setQuery] = useState("");
  const [category, setCategory] =
    useState<(typeof categories)[number]["key"]>("hotels");

  const router = useRouter();

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/${locale}/${category}?q=${encodeURIComponent(query)}`);
  }

  return (
    <section className="relative h-screen min-h-[820px] w-full overflow-hidden">
      <Image
  src="/images/hero-bg.png"
  alt="Panoramic view of Hargeisa at golden hour"
  fill
  priority
  className="object-cover"
/>

      <div className="absolute inset-0 bg-hero-gradient" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center pt-24 container-px text-center text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]">
          <MapPin size={13} />
          {t("eyebrow")}
        </span>

        <h1 className="mt-5 max-w-3xl font-display text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] text-balance">
          {t("title")}
        </h1>

        <p className="mt-5 max-w-xl text-base md:text-lg text-white/85 text-balance">
          {t("subtitle")}
        </p>

        <form
          onSubmit={onSearch}
          className="mt-9 w-full max-w-2xl rounded-2xl md:rounded-full glass p-2 shadow-glass"
        >
          <div className="flex flex-col md:flex-row items-stretch gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-white/90 dark:bg-ink/70 px-4 py-3">
              <Search
                size={18}
                className="text-ink/50 dark:text-sand/50 shrink-0"
              />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full bg-transparent text-sm text-ink dark:text-sand placeholder:text-ink/45 dark:placeholder:text-sand/45 outline-none"
              />
            </div>

            <button
              type="submit"
              className="shrink-0 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              {t("searchButton")}
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {categories.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                category === key
                  ? "bg-white text-ink"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Icon size={13} />
              {nav(key)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}