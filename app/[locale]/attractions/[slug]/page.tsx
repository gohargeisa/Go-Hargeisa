import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Ticket, CalendarClock, MapPin, LightbulbIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getAttractionBySlug, getAllAttractionSlugs, getNearbyForAttraction } from "@/lib/data/attractions";
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
  const slugs = await getAllAttractionSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const a = await getAttractionBySlug(slug);

  if (!a) {
    return {};
  }

  return {
    title: `${a.name} — Hargeisa Attraction`,
    description: a.shortDescription,
    alternates: {
      canonical: `/${locale}/attractions/${a.slug}`,
    },
  };
}

export default async function AttractionDetailPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const attraction = await getAttractionBySlug(slug);
  if (!attraction) notFound();
  const t = await getTranslations("common");
  const { restaurants: nearbyRestaurants, hotels: nearbyHotels } = await getNearbyForAttraction(attraction.id);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Attractions", href: `/${locale}/attractions` },
          { label: attraction.name, href: `/${locale}/attractions/${attraction.slug}` },
        ]}
      />

      <div className="container-px mx-auto pt-6">
        <Gallery cover={attraction.coverImage} images={attraction.gallery} alt={attraction.name} />
      </div>

      <div className="container-px mx-auto grid gap-10 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          <div>
            <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase text-secondary-700">
              {attraction.category}
            </span>
            <h1 className="mt-3 font-display text-3xl font-semibold">{attraction.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/60 dark:text-sand/60">
              <MapPin size={14} /> {attraction.address}
            </p>
            <div className="mt-3">
              <RatingBadge rating={attraction.rating} reviewCount={attraction.reviewCount} size="md" />
            </div>
            <p className="mt-5 text-ink/75 dark:text-sand/75 leading-relaxed">{attraction.description}</p>
          </div>

          {attraction.history && (
            <div>
              <h2 className="font-display text-xl font-semibold mb-3">{t("history")}</h2>
              <p className="text-ink/75 dark:text-sand/75 leading-relaxed">{attraction.history}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl2 border border-ink/8 dark:border-white/10 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <CalendarClock size={16} className="text-primary" /> {t("bestTimeToVisit")}
              </p>
              <p className="mt-1 text-sm text-ink/65 dark:text-sand/65">{attraction.bestTimeToVisit}</p>
            </div>
            <div className="rounded-xl2 border border-ink/8 dark:border-white/10 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Ticket size={16} className="text-primary" /> {t("entryFee")}
              </p>
              <p className="mt-1 text-sm text-ink/65 dark:text-sand/65">{attraction.entryFee}</p>
            </div>
          </div>

          {attraction.visitorTips.length > 0 && (
  <div>
    <h2 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
      <LightbulbIcon size={18} className="text-accent-700" /> {t("visitorTips")}
    </h2>
    <ul className="space-y-2">
      {(attraction.visitorTips as string[]).map((tip: string) => (
        <li key={tip} className="flex gap-2 text-sm text-ink/70 dark:text-sand/70">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          {tip}
        </li>
      ))}
    </ul>
  </div>
)}

          <div>
            <h2 className="font-display text-xl font-semibold mb-4">{t("viewOnMap")}</h2>
            <SingleLocationMapLoader location={attraction.location} label={attraction.name} />
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold mb-4">{t("reviews")}</h2>
            <ReviewsSection
              rating={attraction.rating}
              reviewCount={attraction.reviewCount}
              reviews={attraction.reviews}
            />
            <div className="mt-6">
              <ReviewForm
                listingType="attraction"
                listingId={attraction.id}
                locale={locale}
                pathToRevalidate={`/${locale}/attractions/${attraction.slug}`}
              />
            </div>
          </div>

          {(nearbyRestaurants.length > 0 || nearbyHotels.length > 0) && (
            <div className="grid gap-8 sm:grid-cols-2">
              {nearbyRestaurants.length > 0 && (
                <div>
                  <h3 className="font-display text-lg font-semibold mb-3">{t("nearbyRestaurants")}</h3>
                  <div className="space-y-3">
                    {nearbyRestaurants.map((r) => (
                      <NearbyRow key={r.id} href={`/${locale}/restaurants/${r.slug}`} image={r.coverImage} name={r.name} />
                    ))}
                  </div>
                </div>
              )}
              {nearbyHotels.length > 0 && (
                <div>
                  <h3 className="font-display text-lg font-semibold mb-3">{t("nearbyHotels")}</h3>
                  <div className="space-y-3">
                    {nearbyHotels.map((h) => (
                      <NearbyRow key={h.id} href={`/${locale}/hotels/${h.slug}`} image={h.coverImage} name={h.name} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 h-fit space-y-3 rounded-xl3 border border-ink/8 dark:border-white/10 p-6 shadow-card">
          <AddToTripButton locale={locale} listingType="attraction" listingId={attraction.id} />
          <h3 className="font-display text-lg font-semibold">Plan your visit</h3>
          <p className="text-sm text-ink/70 dark:text-sand/70">
            <strong>{t("entryFee")}:</strong> {attraction.entryFee}
          </p>
          <p className="text-sm text-ink/70 dark:text-sand/70">
            <strong>{t("bestTimeToVisit")}:</strong> {attraction.bestTimeToVisit}
          </p>
        </aside>
      </div>
    </>
  );
}

function NearbyRow({ href, image, name }: { href: string; image: string; name: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl border border-ink/8 dark:border-white/10 p-3 hover:border-primary/40 transition-colors">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
        <Image src={image} alt={name} fill className="object-cover" />
      </div>
      <p className="text-sm font-medium">{name}</p>
    </Link>
  );
}
