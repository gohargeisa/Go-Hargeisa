import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getCafes } from "@/lib/data/cafes";
import { ListingCard } from "@/components/shared/listing-card";
import { PageHero } from "@/components/shared/page-hero";
import { SearchWithin } from "@/components/shared/search-within";
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
    title: "Cafes in Hargeisa — Coffee & Working Spots",
  description: "Modern cafes in Hargeisa with WiFi, working space and specialty drinks.",
    alternates: { canonical: `/${locale}/cafes` },
  };
}

export default async function CafesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { q?: string };
}) {
  const t = await getTranslations("home");
  const common = await getTranslations("common");
  const cafes = await getCafes({ q: searchParams.q });

  return (
    <>
      <PageHero
        eyebrow="Sip"
        title={t("cafesTitle")}
        image={placeholderImage("Cafes in Hargeisa", { tone: "accent" })}
      />
      <section className="container-px mx-auto py-14">
        <SearchWithin basePath={`/${locale}/cafes`} placeholder="Search cafes…" defaultValue={searchParams.q} />

        {cafes.length === 0 ? (
          <p className="mt-10 text-center text-ink/50 dark:text-sand/50">{common("noResults")}</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cafes.map((c) => (
              <ListingCard
                key={c.id}
                href={`/${locale}/cafes/${c.slug}`}
                image={c.coverImage}
                title={c.name}
                subtitle={c.address}
                rating={c.rating}
                reviewCount={c.reviewCount}
                listingType="cafe"
                listingId={c.id}
                locale={locale}
                tag={c.wifi ? "Free WiFi" : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
