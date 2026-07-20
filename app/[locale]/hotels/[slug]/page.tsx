import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Phone, Globe, MapPin } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getHotelBySlug, getAllHotelSlugs, getNearbyAttractionsForHotel } from "@/lib/data/hotels";
import { Gallery } from "@/components/shared/gallery";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { RatingBadge } from "@/components/shared/rating-badge";
import { AmenitiesGrid } from "@/components/shared/amenities-grid";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { AddToTripButton } from "@/components/shared/add-to-trip-button";
import { SingleLocationMapLoader } from "@/components/map/single-location-map-loader";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllHotelSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const hotel = await getHotelBySlug(slug);
  if (!hotel) return {};
  return {
    title: `${hotel.name} — Hotel in Hargeisa`,
    description: hotel.shortDescription,
    openGraph: { images: [hotel.coverImage] },
    alternates: { canonical: `/${locale}/hotels/${hotel.slug}` },
  };
}

export default async function HotelDetailPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const hotel = await getHotelBySlug(slug);
  if (!hotel) notFound();
  const t = await getTranslations("common");
  const nearby = await getNearbyAttractionsForHotel(hotel.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.name,
    description: hotel.shortDescription,
    image: hotel.coverImage,
    address: { "@type": "PostalAddress", streetAddress: hotel.address, addressLocality: "Hargeisa" },
    telephone: hotel.phone,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: hotel.rating,
      reviewCount: hotel.reviewCount,
    },
    priceRange: hotel.priceRange,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs
        items={[
          { label: "Hotels", href: `/${locale}/hotels` },
          { label: hotel.name, href: `/${locale}/hotels/${hotel.slug}` },
        ]}
      />


      <div className="container-px mx-auto pt-6">
        <Gallery cover={hotel.coverImage} images={hotel.gallery} alt={hotel.name} />
      </div>

      <div className="container-px mx-auto grid gap-10 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-semibold">{hotel.name}</h1>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {hotel.priceRange}
              </span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/60 dark:text-sand/60">
              <MapPin size={14} /> {hotel.address}
            </p>
            <div className="mt-3">
              <RatingBadge rating={hotel.rating} reviewCount={hotel.reviewCount} size="md" />
            </div>
            <p className="mt-5 text-ink/75 dark:text-sand/75 leading-relaxed">{hotel.description}</p>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold mb-4">{t("amenities")}</h2>
            <AmenitiesGrid amenities={hotel.amenities} />
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold mb-4">{t("viewOnMap")}</h2>
            <SingleLocationMapLoader location={hotel.location} label={hotel.name} />
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold mb-4">{t("reviews")}</h2>
            <ReviewsSection rating={hotel.rating} reviewCount={hotel.reviewCount} reviews={hotel.reviews} />
            <div className="mt-6">
              <ReviewForm
                listingType="hotel"
                listingId={hotel.id}
                locale={locale}
                pathToRevalidate={`/${locale}/hotels/${hotel.slug}`}
              />
            </div>
          </div>

          {nearby.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold mb-4">{t("nearbyAttractions")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {nearby.map((a) => (
                  <Link
                    key={a.id}
                    href={`/${locale}/attractions/${a.slug}`}
                    className="flex gap-3 rounded-xl2 border border-ink/8 dark:border-white/10 p-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                      <Image src={a.coverImage} alt={a.name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{a.name}</p>
                      <p className="text-xs text-ink/55 dark:text-sand/55 line-clamp-2">{a.shortDescription}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 h-fit space-y-4 rounded-xl3 border border-ink/8 dark:border-white/10 p-6 shadow-card">
          <AddToTripButton locale={locale} listingType="hotel" listingId={hotel.id} />
          <h3 className="font-display text-lg font-semibold">Contact this hotel</h3>
          {hotel.phone && (
            <a href={`tel:${hotel.phone}`} className="flex items-center gap-3 text-sm hover:text-primary">
              <Phone size={16} /> {hotel.phone}
            </a>
          )}
          {hotel.website && (
            <a
              href={hotel.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm hover:text-primary"
            >
              <Globe size={16} /> Visit website
            </a>
          )}
          <button className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors">
            {t("bookNow")}
          </button>
        </aside>
      </div>
    </>
  );
}
