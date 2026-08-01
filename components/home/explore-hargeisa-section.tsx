import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Fuel, MoonStar, Pill, Sparkles, ShoppingCart, Stethoscope, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { EmptyState } from "@/components/shared/empty-state";
import type { ExploreHargeisaCounts } from "@/lib/data/city-services";

/** Each category's real destination page — a tile only ever renders when
 * its count is > 0, so every href here is guaranteed to lead to real,
 * published content, never a "coming soon" dead end. */
const CATEGORY_META: {
  key: keyof ExploreHargeisaCounts;
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  href: string;
}[] = [
  { key: "hospital", icon: Stethoscope, titleKey: "exploreHargeisaHospitalsTitle", descriptionKey: "exploreHargeisaHospitalsDescription", href: "/city-services" },
  { key: "pharmacy", icon: Pill, titleKey: "exploreHargeisaPharmaciesTitle", descriptionKey: "exploreHargeisaPharmaciesDescription", href: "/city-services" },
  { key: "gasStation", icon: Fuel, titleKey: "exploreHargeisaGasStationsTitle", descriptionKey: "exploreHargeisaGasStationsDescription", href: "/services/gas-stations" },
  { key: "supermarket", icon: ShoppingCart, titleKey: "exploreHargeisaSupermarketsTitle", descriptionKey: "exploreHargeisaSupermarketsDescription", href: "/city-services" },
  { key: "mosque", icon: MoonStar, titleKey: "exploreHargeisaMosquesTitle", descriptionKey: "exploreHargeisaMosquesDescription", href: "/city-map" },
];

export async function ExploreHargeisaSection({ locale, counts }: { locale: string; counts: ExploreHargeisaCounts }) {
  const t = await getTranslations("home");
  const cards = CATEGORY_META.filter((c) => counts[c.key] > 0);

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
          {cards.length === 0 ? (
            <div className="mt-10 md:mt-14">
              <EmptyState
                icon={Sparkles}
                title={t("exploreHargeisaEmptyTitle")}
                description={t("exploreHargeisaEmptyDescription")}
              />
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
              {cards.map(({ key, icon: Icon, titleKey, descriptionKey, href }) => (
                <Link
                  key={key}
                  href={`/${locale}${href}`}
                  className="group flex h-full flex-col rounded-2xl border border-ink/8 bg-white p-6 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03] sm:p-7"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 ease-premium group-hover:scale-105">
                    <Icon size={26} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold text-ink dark:text-white">{t(titleKey)}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink/60 dark:text-sand/60">{t(descriptionKey)}</p>
                </Link>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
