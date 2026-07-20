import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Clock, MapPin } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import {
  getRestaurantBySlug,
  getAllRestaurantSlugs,
} from "@/lib/data/restaurants";
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
  const slugs = await getAllRestaurantSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const r = await getRestaurantBySlug(slug);

  if (!r) {
    return {};
  }

  return {
    title: `${r.name} — Restaurant in Hargeisa`,
    description: r.shortDescription,
    alternates: {
      canonical: `/${locale}/restaurants/${r.slug}`,
    },
  };
}

export default async function RestaurantDetailPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) notFound();

  const t = await getTranslations("common");

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Restaurants", href: `/${locale}/restaurants` },
          {
            label: restaurant.name,
            href: `/${locale}/restaurants/${restaurant.slug}`,
          },
        ]}
      />

      <div className="container-px mx-auto pt-6">
        <Gallery
          cover={restaurant.coverImage}
          images={restaurant.gallery}
          alt={restaurant.name}
        />
      </div>

      <div className="container-px mx-auto grid gap-10 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          <div>
            <div className="flex flex-wrap gap-2">
              {(restaurant.cuisine as string[]).map((c: string) => (
                <span
                  key={c}
                  className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary-700"
                >
                  {c}
                </span>
              ))}
            </div>

            <h1 className="mt-3 font-display text-3xl font-semibold">
              {restaurant.name}
            </h1>

            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/60 dark:text-sand/60">
              <MapPin size={14} /> {restaurant.address}
            </p>

            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink/60 dark:text-sand/60">
              <Clock size={14} /> {restaurant.openingHours}
            </p>

            <div className="mt-3">
              <RatingBadge
                rating={restaurant.rating}
                reviewCount={restaurant.reviewCount}
                size="md"
              />
            </div>

            <p className="mt-5 text-ink/75 dark:text-sand/75 leading-relaxed">
              {restaurant.description}
            </p>
          </div>

          {restaurant.menuHighlights.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold mb-4">
                Menu Highlights
              </h2>

              <div className="divide-y divide-ink/8 dark:divide-white/10 rounded-xl2 border border-ink/8 dark:border-white/10">
                {restaurant.menuHighlights.map(
                  (
                    item: {
                      name: string;
                      price: string;
                      description?: string;
                    }
                  ) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold">{item.name}</p>

                        {item.description && (
                          <p className="text-xs text-ink/55 dark:text-sand/55">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <span className="text-sm font-semibold text-primary">
                        {item.price}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div>
            <h2 className="font-display text-xl font-semibold mb-4">
              {t("viewOnMap")}
            </h2>

            <SingleLocationMapLoader
              location={restaurant.location}
              label={restaurant.name}
            />
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold mb-4">
              {t("reviews")}
            </h2>

            <ReviewsSection
              rating={restaurant.rating}
              reviewCount={restaurant.reviewCount}
              reviews={restaurant.reviews}
            />

            <div className="mt-6">
              <ReviewForm
                listingType="restaurant"
                listingId={restaurant.id}
                locale={locale}
                pathToRevalidate={`/${locale}/restaurants/${restaurant.slug}`}
              />
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 h-fit space-y-4 rounded-xl3 border border-ink/8 dark:border-white/10 p-6 shadow-card">
          <AddToTripButton
            locale={locale}
            listingType="restaurant"
            listingId={restaurant.id}
          />

          <h3 className="font-display text-lg font-semibold">
            {t("openingHours")}
          </h3>

          <p className="text-sm text-ink/70 dark:text-sand/70">
            {restaurant.openingHours}
          </p>

          {restaurant.reservable && (
            <button className="w-full rounded-full bg-secondary py-3 text-sm font-semibold text-white hover:bg-secondary-700 transition-colors">
              {t("reserveTable")}
            </button>
          )}
        </aside>
      </div>
    </>
  );
}