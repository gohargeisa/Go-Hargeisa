import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Wifi, Laptop, Clock, MapPin } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getCafeBySlug, getAllCafeSlugs } from "@/lib/data/cafes";
import { Gallery } from "@/components/shared/gallery";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { RatingBadge } from "@/components/shared/rating-badge";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { AddToTripButton } from "@/components/shared/add-to-trip-button";
import { SingleLocationMapLoader } from "@/components/map/single-location-map-loader";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllCafeSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const cafe = await getCafeBySlug(slug);

  if (!cafe) {
    return {};
  }

  return {
    title: `${cafe.name} — Cafe in Hargeisa`,
    description: cafe.shortDescription,
    alternates: {
      canonical: `/${locale}/cafes/${cafe.slug}`,
    },
  };
}

export default async function CafeDetailPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const cafe = await getCafeBySlug(slug);

  if (!cafe) notFound();

  const t = await getTranslations("common");

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Cafes", href: `/${locale}/cafes` },
          { label: cafe.name, href: `/${locale}/cafes/${cafe.slug}` },
        ]}
      />

      <div className="container-px mx-auto pt-6">
        <Gallery
          cover={cafe.coverImage}
          images={cafe.gallery}
          alt={cafe.name}
        />
      </div>

      <div className="container-px mx-auto grid gap-10 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          <div>
            <h1 className="font-display text-3xl font-semibold">
              {cafe.name}
            </h1>

            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/60 dark:text-sand/60">
              <MapPin size={14} /> {cafe.address}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RatingBadge
                rating={cafe.rating}
                reviewCount={cafe.reviewCount}
                size="md"
              />

              {cafe.wifi && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Wifi size={12} /> Free WiFi
                </span>
              )}

              {cafe.workingSpace && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary-700">
                  <Laptop size={12} /> Working Space
                </span>
              )}
            </div>

            <p className="mt-5 text-ink/75 dark:text-sand/75 leading-relaxed">
              {cafe.description}
            </p>
          </div>

          {cafe.specialDrinks.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold mb-4">
                Special Drinks
              </h2>

              <div className="flex flex-wrap gap-2">
                {(cafe.specialDrinks as string[]).map((d: string) => (
                  <span
                    key={d}
                    className="rounded-full border border-ink/10 dark:border-white/15 px-4 py-2 text-sm"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="font-display text-xl font-semibold mb-4">
              {t("viewOnMap")}
            </h2>

            <SingleLocationMapLoader
              location={cafe.location}
              label={cafe.name}
            />
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold mb-4">
              {t("reviews")}
            </h2>

            <ReviewsSection
              rating={cafe.rating}
              reviewCount={cafe.reviewCount}
              reviews={cafe.reviews}
            />

            <div className="mt-6">
              <ReviewForm
                listingType="cafe"
                listingId={cafe.id}
                locale={locale}
                pathToRevalidate={`/${locale}/cafes/${cafe.slug}`}
              />
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit space-y-4 rounded-xl3 border border-ink/8 dark:border-white/10 p-6 shadow-card">
          <AddToTripButton
            locale={locale}
            listingType="cafe"
            listingId={cafe.id}
          />

          <h3 className="font-display text-lg font-semibold flex items-center gap-2">
            <Clock size={16} /> {t("openingHours")}
          </h3>

          <p className="text-sm text-ink/70 dark:text-sand/70">
            {cafe.openingHours}
          </p>
        </aside>
      </div>
    </>
  );
}