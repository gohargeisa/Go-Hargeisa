import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Ticket, CalendarClock, MapPin, LightbulbIcon, Navigation, ExternalLink, Star, Tag } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getAttractionBySlug, getAllAttractionSlugs, getNearbyForAttraction, getAttractions } from "@/lib/data/attractions";
import { HotelHeaderTop } from "@/components/shared/hotel-header-top";
import { HotelGallerySlider } from "@/components/shared/hotel-gallery-slider";
import { HotelNavTabs, type HotelNavTab } from "@/components/shared/hotel-nav-tabs";
import { InfoCardsStrip, type InfoCard } from "@/components/shared/info-cards-strip";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { getMyReviewForListing } from "@/lib/data/reviews";
import { AddToTripButton } from "@/components/shared/add-to-trip-button";
import { ListingCard } from "@/components/shared/listing-card";
import { resolveMapsUrl, resolveDirectionsUrl } from "@/lib/utils/google-maps";
import { Reveal } from "@/components/home/reveal";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
import { safeJsonLd } from "@/lib/utils/json-ld";

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
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const a = await getAttractionBySlug(slug);

  if (!a) {
    return {};
  }

  return {
    title: `${a.name} — Hargeisa Attraction`,
    description: a.shortDescription,
    openGraph: { images: [a.coverImage] },
    alternates: localeAlternates(locale as Locale, `/attractions/${a.slug}`),
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
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");
  const th = await getTranslations("hotelDetail");
  const [{ restaurants: nearbyRestaurants, hotels: nearbyHotels }, allAttractions, myReview] = await Promise.all([
    getNearbyForAttraction(attraction.id),
    getAttractions(),
    getMyReviewForListing("attraction", attraction.id),
  ]);
  const similarAttractions = allAttractions.filter((a) => a.id !== attraction.id).slice(0, 4);

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(attraction.visitorTips.length > 0 ? [{ id: "tips", label: t("visitorTips") }] : []),
    { id: "location", label: td("location") },
    { id: "reviews", label: t("reviews") },
  ];

  const googleMapsHref = resolveMapsUrl(attraction.location, attraction.googleMapsUrl);
  const directionsHref = resolveDirectionsUrl(attraction.location);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: attraction.name,
    description: attraction.description,
    image: attraction.coverImage,
    address: { "@type": "PostalAddress", streetAddress: attraction.address, addressLocality: "Hargeisa" },
    ...(attraction.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: attraction.rating, reviewCount: attraction.reviewCount } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <Breadcrumbs
        items={[
          { label: tNav("attractions"), href: `/${locale}/attractions` },
          { label: attraction.name, href: `/${locale}/attractions/${attraction.slug}` },
        ]}
      />

      <HotelHeaderTop
        name={attraction.name}
        rating={attraction.rating}
        reviewCount={attraction.reviewCount}
        categoryLabel={attraction.category}
      />

      <InfoCardsStrip
        cards={[
          ...(attraction.reviewCount > 0 ? [{ icon: Star, label: t("rating"), value: attraction.rating.toFixed(1) }] : []),
          { icon: Tag, label: th("category"), value: attraction.category },
          { icon: CalendarClock, label: t("bestTimeToVisit"), value: attraction.bestTimeToVisit },
          { icon: Ticket, label: t("entryFee"), value: attraction.entryFee ?? "—" },
        ]}
      />

      <HotelGallerySlider cover={attraction.coverImage} images={attraction.gallery} alt={attraction.name} />

      <div className="mt-8">
        <HotelNavTabs tabs={navTabs} />
      </div>

      <div className="container-px mx-auto grid gap-10 py-10 lg:grid-cols-3 lg:gap-12">
        <div className="lg:col-span-2 space-y-14">
          <Reveal>
            <section id="overview" aria-labelledby="overview-heading" className="scroll-mt-36">
              <h2 id="overview-heading" className="mb-5 font-display text-2xl font-semibold">
                {td("overview")}
              </h2>
              <p className="leading-relaxed text-ink/75 dark:text-sand/75">{attraction.description}</p>

              {attraction.history && (
                <div className="mt-8">
                  <h3 className="mb-3 font-display text-lg font-semibold">{t("history")}</h3>
                  <p className="leading-relaxed text-ink/75 dark:text-sand/75">{attraction.history}</p>
                </div>
              )}
            </section>
          </Reveal>

          {attraction.visitorTips.length > 0 && (
            <Reveal>
              <section id="tips" aria-labelledby="tips-heading" className="scroll-mt-36">
                <h2 id="tips-heading" className="mb-5 flex items-center gap-2 font-display text-2xl font-semibold">
                  <LightbulbIcon size={20} className="text-accent-700" aria-hidden="true" />
                  {t("visitorTips")}
                </h2>
                <ul className="space-y-2.5">
                  {attraction.visitorTips.map((tip) => (
                    <li
                      key={tip}
                      className="flex gap-2.5 rounded-xl2 border border-ink/8 bg-white px-4 py-3 text-sm text-ink/75 dark:border-white/10 dark:bg-white/[0.03] dark:text-sand/75"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}

          <Reveal>
            <section id="location" aria-labelledby="location-heading" className="scroll-mt-36">
              <h2 id="location-heading" className="mb-5 font-display text-2xl font-semibold">
                {td("location")}
              </h2>
              <div className="flex flex-col gap-4 rounded-xl3 border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-sm text-ink/70 dark:text-sand/70">
                  <MapPin size={16} className="shrink-0 text-primary" aria-hidden="true" />
                  {attraction.address}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {directionsHref && (
                    <PrimaryButton href={directionsHref} external size="sm">
                      <Navigation size={14} aria-hidden="true" />
                      {th("directions")}
                    </PrimaryButton>
                  )}
                  {googleMapsHref && (
                    <SecondaryButton href={googleMapsHref} external size="sm">
                      {td("openInGoogleMaps")}
                      <ExternalLink size={14} aria-hidden="true" />
                    </SecondaryButton>
                  )}
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-36">
              <h2 id="reviews-heading" className="mb-5 font-display text-2xl font-semibold">
                {t("reviews")}
              </h2>
              <ReviewsSection
                rating={attraction.rating}
                reviewCount={attraction.reviewCount}
                reviews={attraction.reviews}
              />
              <div className="mt-6">
                <ReviewForm
                  key={myReview?.id ?? "new"}
                  listingType="attraction"
                  listingId={attraction.id}
                  locale={locale}
                  pathToRevalidate={`/${locale}/attractions/${attraction.slug}`}
                  allowPhotos
                  existingReview={myReview}
                />
              </div>
            </section>
          </Reveal>

          {(nearbyRestaurants.length > 0 || nearbyHotels.length > 0) && (
            <Reveal>
              <section aria-labelledby="nearby-heading">
                <div className="grid gap-8 sm:grid-cols-2">
                  {nearbyRestaurants.length > 0 && (
                    <div>
                      <h3 id="nearby-heading" className="mb-3 font-display text-lg font-semibold">{t("nearbyRestaurants")}</h3>
                      <div className="space-y-3">
                        {nearbyRestaurants.map((r) => (
                          <NearbyRow key={r.id} href={`/${locale}/restaurants/${r.slug}`} image={r.coverImage} name={r.name} subtitle={r.address} />
                        ))}
                      </div>
                    </div>
                  )}
                  {nearbyHotels.length > 0 && (
                    <div>
                      <h3 className="mb-3 font-display text-lg font-semibold">{t("nearbyHotels")}</h3>
                      <div className="space-y-3">
                        {nearbyHotels.map((h) => (
                          <NearbyRow key={h.id} href={`/${locale}/hotels/${h.slug}`} image={h.coverImage} name={h.name} subtitle={h.address} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </Reveal>
          )}
        </div>

        <aside className="h-fit space-y-3 rounded-xl3 border border-ink/8 p-6 shadow-card dark:border-white/10 lg:sticky lg:top-24">
          <AddToTripButton locale={locale} listingType="attraction" listingId={attraction.id} />
          <h3 className="font-display text-lg font-semibold">{td("planYourVisit")}</h3>
          <p className="text-sm text-ink/70 dark:text-sand/70">
            <strong>{t("entryFee")}:</strong> {attraction.entryFee ?? "—"}
          </p>
          <p className="text-sm text-ink/70 dark:text-sand/70">
            <strong>{t("bestTimeToVisit")}:</strong> {attraction.bestTimeToVisit}
          </p>
        </aside>
      </div>

      {similarAttractions.length > 0 && (
        <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{td("youMayAlsoLike")}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
                {similarAttractions.map((a) => (
                  <div key={a.id} className="min-w-[272px] sm:min-w-0">
                    <ListingCard
                      href={`/${locale}/attractions/${a.slug}`}
                      image={a.coverImage}
                      title={a.name}
                      subtitle={a.address}
                      rating={a.rating}
                      reviewCount={a.reviewCount}
                      listingType="attraction"
                      listingId={a.id}
                      locale={locale}
                    />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}

function NearbyRow({ href, image, name, subtitle }: { href: string; image: string; name: string; subtitle?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl2 border border-ink/8 p-3 transition-colors hover:border-primary/40 dark:border-white/10"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
        <Image src={image} alt={name} fill sizes="64px" className="object-cover" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{name}</p>
        {subtitle && <p className="line-clamp-1 text-xs text-ink/55 dark:text-sand/55">{subtitle}</p>}
      </div>
    </Link>
  );
}
