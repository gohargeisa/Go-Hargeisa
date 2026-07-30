import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getDestinations } from "@/lib/data/destinations";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { placeholderImage } from "@/lib/placeholder-image";

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
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        image={placeholderImage("Explore Hargeisa", { tone: "primary" })}
      />
      <section className="container-px mx-auto py-14">
        {destinations.length === 0 ? (
          <EmptyState icon={MapPin} title={t("noDestinationsTitle")} description={t("noDestinationsDescription")} />
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {destinations.map((d) => (
              <Link key={d.id} href={`/${locale}/explore/${d.slug}`} className="group relative h-72 overflow-hidden rounded-xl3">
                <Image src={d.image} alt={d.name} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <h2 className="font-display text-xl font-semibold">{d.name}</h2>
                  <p className="mt-1 text-sm text-white/70 line-clamp-2">{d.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
