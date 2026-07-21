import Image from "next/image";
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
      /><section className="relative h-[55vh] w-full overflow-hidden">
  <Image
  src={restaurant.coverImage}
  alt={restaurant.name}
  fill
  priority
  className="object-cover"
/>

  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

  <div className="absolute bottom-10 left-0 right-0 container-px mx-auto">
    <div className="flex flex-wrap gap-2 mb-3">
      {(restaurant.cuisine as string[]).map((c) => (
        <span
          key={c}
          className="rounded-full bg-white/20 backdrop-blur px-3 py-1 text-sm text-white"
        >
          {c}
        </span>
      ))}
    </div>

    <h1 className="text-5xl font-bold text-white">
      {restaurant.name}
    </h1>

    <p className="mt-3 flex items-center gap-2 text-white/90">
      <MapPin size={18} />
      {restaurant.address}
    </p>
  </div>
</section>

      <div className="container-px mx-auto -mt-20 relative z-20">
        <Gallery
          cover={restaurant.coverImage}
          images={restaurant.gallery}
          alt={restaurant.name}
        />
      </div>

      <div className="container-px mx-auto grid gap-10 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-8 shadow-xl border border-zinc-200 dark:border-zinc-800">
  <div className="flex items-center gap-3 mb-5">
    <RatingBadge
      rating={restaurant.rating}
      reviewCount={restaurant.reviewCount}
      size="md"
    />
  </div>

  <div className="grid grid-cols-3 gap-4 mb-8">
    <div className="rounded-2xl bg-primary/10 p-4 text-center">
      <p className="text-xs text-gray-500">Rating</p>
      <p className="text-2xl font-bold">{restaurant.rating}</p>
    </div>

    <div className="rounded-2xl bg-primary/10 p-4 text-center">
      <p className="text-xs text-gray-500">Reviews</p>
      <p className="text-2xl font-bold">{restaurant.reviewCount}</p>
    </div>

    <div className="rounded-2xl bg-primary/10 p-4 text-center">
      <p className="text-xs text-gray-500">Hours</p>
      <p className="text-sm font-bold">{restaurant.openingHours}</p>
    </div>
  </div>

  <p className="leading-8 text-ink/75 dark:text-sand/75">
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

        <aside className="lg:sticky lg:top-24 h-fit rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl space-y-6">
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
            <button className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              {t("reserveTable")}
            </button>
          )}
        </aside>
      </div>
    </>
  );
}