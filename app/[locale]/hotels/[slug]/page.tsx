import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExternalLink, MapPin } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getHotelBySlug, getAllHotelSlugs, getNearbyAttractionsForHotel, getHotels } from "@/lib/data/hotels";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { HotelHero } from "@/components/shared/hotel-hero";
import { HotelGallery } from "@/components/shared/hotel-gallery";
import { HotelAmenities } from "@/components/shared/hotel-amenities";
import { HotelBookingCard } from "@/components/shared/hotel-booking-card";
import { MobileBookingBar } from "@/components/shared/mobile-booking-bar";
import { HotelCard } from "@/components/shared/hotel-card";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { SingleLocationMapLoader } from "@/components/map/single-location-map-loader";
import { Reveal } from "@/components/home/reveal";

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
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");
  const [nearby, allHotels] = await Promise.all([
    getNearbyAttractionsForHotel(hotel.id),
    getHotels(),
  ]);
  const similarHotels = allHotels.filter((h) => h.id !== hotel.id).slice(0, 4);

  const hasCoordinates = Number.isFinite(hotel.location?.lat) && Number.isFinite(hotel.location?.lng);
  const googleMapsHref = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${hotel.location.lat},${hotel.location.lng}`
    : undefined;

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
          { label: tNav("hotels"), href: `/${locale}/hotels` },
          { label: hotel.name, href: `/${locale}/hotels/${hotel.slug}` },
        ]}
      />

      <HotelHero
        image={hotel.coverImage}
        name={hotel.name}
        address={hotel.address}
        rating={hotel.rating}
        reviewCount={hotel.reviewCount}
        priceRange={hotel.priceRange}
        featured={hotel.featured}
      />

      <HotelGallery cover={hotel.coverImage} images={hotel.gallery} alt={hotel.name} />

      <div className="container-px mx-auto grid gap-10 pb-28 pt-10 lg:grid-cols-3 lg:pb-10">
        <div className="space-y-12 lg:col-span-2">
          <Reveal>
            <section aria-labelledby="overview-heading">
              <h2 id="overview-heading" className="font-display text-2xl font-semibold">
                {td("overview")}
              </h2>
              <p className="mt-4 leading-relaxed text-ink/75 dark:text-sand/75">{hotel.description}</p>
            </section>
          </Reveal>

          <Reveal>
            <section aria-labelledby="amenities-heading">
              <h2 id="amenities-heading" className="mb-5 font-display text-2xl font-semibold">
                {t("amenities")}
              </h2>
              <HotelAmenities amenities={hotel.amenities} />
            </section>
          </Reveal>

          <Reveal>
            <section aria-labelledby="location-heading">
              <h2 id="location-heading" className="mb-5 font-display text-2xl font-semibold">
                {td("location")}
              </h2>
              <div className="overflow-hidden rounded-xl3 border border-ink/8 dark:border-white/10">
                <SingleLocationMapLoader location={hotel.location} label={hotel.name} />
                <div className="flex flex-col gap-3 border-t border-ink/8 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-sm text-ink/70 dark:text-sand/70">
                    <MapPin size={16} className="shrink-0 text-primary" aria-hidden="true" />
                    {hotel.address}
                  </p>
                  {googleMapsHref && (
                    <a
                      href={googleMapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
                    >
                      {td("openInGoogleMaps")}
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section aria-labelledby="policies-heading">
              <h2 id="policies-heading" className="mb-4 font-display text-2xl font-semibold">
                {td("policies")}
              </h2>
              <div className="rounded-xl2 border border-ink/8 bg-ink/[0.02] p-5 text-sm leading-relaxed text-ink/70 dark:border-white/10 dark:bg-white/[0.02] dark:text-sand/70">
                {td("policiesText", { name: hotel.name })}
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section aria-labelledby="reviews-heading">
              <h2 id="reviews-heading" className="mb-5 font-display text-2xl font-semibold">
                {t("reviews")}
              </h2>
              <ReviewsSection rating={hotel.rating} reviewCount={hotel.reviewCount} reviews={hotel.reviews} />
              <div className="mt-6">
                <ReviewForm
                  listingType="hotel"
                  listingId={hotel.id}
                  locale={locale}
                  pathToRevalidate={`/${locale}/hotels/${hotel.slug}`}
                />
              </div>
            </section>
          </Reveal>

          {nearby.length > 0 && (
            <Reveal>
              <section aria-labelledby="nearby-heading">
                <h2 id="nearby-heading" className="mb-5 font-display text-2xl font-semibold">
                  {t("nearbyAttractions")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {nearby.map((a) => (
                    <Link
                      key={a.id}
                      href={`/${locale}/attractions/${a.slug}`}
                      className="flex gap-3 rounded-xl2 border border-ink/8 p-3 transition-colors hover:border-primary/40 dark:border-white/10"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                        <Image src={a.coverImage} alt={a.name} fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{a.name}</p>
                        <p className="line-clamp-2 text-xs text-ink/55 dark:text-sand/55">{a.shortDescription}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </Reveal>
          )}
        </div>

        <aside className="hidden h-fit rounded-xl3 border border-ink/8 p-6 shadow-card dark:border-white/10 lg:sticky lg:top-24 lg:block">
          <HotelBookingCard
            hotelId={hotel.id}
            name={hotel.name}
            priceRange={hotel.priceRange}
            phone={hotel.phone}
            website={hotel.website}
            locale={locale}
          />
        </aside>
      </div>

      {similarHotels.length > 0 && (
        <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{td("youMayAlsoLike")}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
                {similarHotels.map((h) => (
                  <div key={h.id} className="min-w-[280px] sm:min-w-0">
                    <HotelCard
                      href={`/${locale}/hotels/${h.slug}`}
                      image={h.coverImage}
                      name={h.name}
                      address={h.address}
                      rating={h.rating}
                      reviewCount={h.reviewCount}
                      priceRange={h.priceRange}
                      amenities={h.amenities}
                      featured={h.featured}
                      hotelId={h.id}
                      locale={locale}
                      website={h.website}
                    />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <MobileBookingBar
        hotelId={hotel.id}
        name={hotel.name}
        priceRange={hotel.priceRange}
        phone={hotel.phone}
        website={hotel.website}
        locale={locale}
      />
    </>
  );
}
