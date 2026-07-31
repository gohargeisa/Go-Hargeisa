import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getDestinations } from "@/lib/data/destinations";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/home/reveal";

/** Reuses the shared hero photo — same swap-in-place pattern as attractions-hero.tsx / about-hero.tsx. */
const EXPLORE_HERO_IMAGE = "/images/hero-bg.png";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Explore Hargeisa — Neighborhoods & Districts",
  description: "Explore Hargeisa neighborhood by neighborhood.",
    alternates: localeAlternates(locale as Locale, "/explore"),
  };
}

export default async function ExplorePage({ params: { locale } }: { params: { locale: string } }) {
  const destinations = await getDestinations();
  const t = await getTranslations({ locale, namespace: "explore" });

  return (
    <>
      <PremiumPageHero
        image={EXPLORE_HERO_IMAGE}
        imageAlt="Panoramic view of Hargeisa"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        scrollHint={t("scrollHint")}
      />
      <section className="container-px mx-auto py-16 md:py-24">
        {destinations.length === 0 ? (
          <EmptyState icon={MapPin} title={t("noDestinationsTitle")} description={t("noDestinationsDescription")} />
        ) : (
          <Reveal>
            <div className="grid gap-6 md:grid-cols-3">
              {destinations.map((d) => (
                <Link
                  key={d.id}
                  href={`/${locale}/explore/${d.slug}`}
                  className="group relative h-72 overflow-hidden rounded-xl3 shadow-soft transition-shadow duration-300 ease-premium hover:shadow-card"
                >
                  <Image
                    src={d.image}
                    alt={d.name}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <h2 className="font-display text-xl font-semibold">{d.name}</h2>
                    <p className="mt-1 text-sm text-white/70 line-clamp-2">{d.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        )}
      </section>
    </>
  );
}
