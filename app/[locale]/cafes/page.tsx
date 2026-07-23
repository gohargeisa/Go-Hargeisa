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

  // Sort: featured first, then by rating
  const sortedCafes = cafes.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return b.rating - a.rating;
  });

  return (
    <>
      <PageHero
        eyebrow="Sip"
        title={t("cafesTitle")}
        image={placeholderImage("Cafes in Hargeisa", { tone: "accent" })}
      />
      
      <section className="container-px mx-auto py-10 md:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              {cafes.length} Cafes
            </h2>
            <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
              {searchParams.q ? `Results for "${searchParams.q}"` : "Browse all cafes in Hargeisa"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <SearchWithin
            basePath={`/${locale}/cafes`}
            placeholder="Search cafes…"
            defaultValue={searchParams.q}
          />
        </div>

        {cafes.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-ink/20 bg-ink/5 p-12 text-center dark:border-white/20 dark:bg-white/[0.02]">
            <h3 className="font-display text-lg font-semibold">No cafes found</h3>
            <p className="mt-2 text-sm text-ink/60 dark:text-sand/60">
              {searchParams.q ? "Try adjusting your search" : "Check back soon for more cafes"}
            </p>
          </div>
        ) : (
          <div className="mt-10">
            {/* Featured Cafes Section */}
            {sortedCafes.some((c) => c.featured) && (
              <div className="mb-12">
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">⭐ Featured Cafes</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">Our top-rated coffee spots</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedCafes
                    .filter((c) => c.featured)
                    .map((c) => (
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
                        tag={c.wifi ? "Free WiFi" : "Featured"}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* All Cafes Section */}
            {sortedCafes.some((c) => !c.featured) && (
              <div>
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">All Cafes</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
                    {sortedCafes.filter((c) => !c.featured).length} available cafes
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedCafes
                    .filter((c) => !c.featured)
                    .map((c) => (
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
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
