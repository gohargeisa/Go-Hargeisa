import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ShoppingBag } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { ListingCard } from "@/components/shared/listing-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/home/reveal";
import { getAttractions } from "@/lib/data/attractions";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
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
    title: "Shopping in Hargeisa — Markets & Malls",
  description: "Where to shop in Hargeisa: Waheen Market, gold souks and modern shopping centers.",
    alternates: localeAlternates(locale as Locale, "/shopping"),
  };
}

export default async function ShoppingPage({ params: { locale } }: { params: { locale: string } }) {
  const shoppingSpots = await getAttractions({ category: "market" });
  const t = await getTranslations({ locale, namespace: "shopping" });

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        image={placeholderImage("Shopping in Hargeisa", { tone: "accent" })}
      />
      <section className="container-px mx-auto py-10 md:py-14">
        {shoppingSpots.length === 0 ? (
          <EmptyState icon={ShoppingBag} title={t("emptyStateTitle")} description={t("emptyState")} />
        ) : (
          <Reveal>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shoppingSpots.map((s) => (
                <ListingCard
                  key={s.id}
                  href={`/${locale}/attractions/${s.slug}`}
                  image={s.coverImage}
                  title={s.name}
                  subtitle={s.address}
                  rating={s.rating}
                  reviewCount={s.reviewCount}
                />
              ))}
            </div>
          </Reveal>
        )}
      </section>
    </>
  );
}
