import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExternalLink, FileText, Laptop, MapPin, Navigation, Wifi } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getCafeBySlug, getAllCafeSlugs, getCafes } from "@/lib/data/cafes";
import { getSiteSettings } from "@/lib/actions/settings";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ViewTracker } from "@/components/shared/view-tracker";
import { HotelHeaderTop } from "@/components/shared/hotel-header-top";
import { HotelActionBar } from "@/components/shared/hotel-action-bar";
import { CafeQuickInfoCards } from "@/components/shared/cafe-quick-info-cards";
import { HotelGallerySlider } from "@/components/shared/hotel-gallery-slider";
import { HotelNavTabs, type HotelNavTab } from "@/components/shared/hotel-nav-tabs";
import { BusinessPhotoGallery } from "@/components/shared/business-photo-gallery";
import { CAFE_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { CafeActionCard } from "@/components/shared/cafe-action-card";
import { MobileBookingBar } from "@/components/shared/mobile-booking-bar";
import { ListingCard } from "@/components/shared/listing-card";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { SingleLocationMapLoader } from "@/components/map/single-location-map-loader";
import { Reveal } from "@/components/home/reveal";

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
  if (!cafe) return {};
  return {
    title: `${cafe.name} — Cafe in Hargeisa`,
    description: cafe.shortDescription,
    openGraph: { images: [cafe.coverImage] },
    alternates: { canonical: `/${locale}/cafes/${cafe.slug}` },
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
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");
  const th = await getTranslations("hotelDetail");
  const [allCafes, siteSettings] = await Promise.all([getCafes(), getSiteSettings()]);
  const similarCafes = allCafes.filter((c) => c.id !== cafe.id).slice(0, 4);
  const whatsappFallback = (siteSettings as { whatsapp_number?: string } | null)?.whatsapp_number ?? undefined;

  const hasCoordinates = Number.isFinite(cafe.location?.lat) && Number.isFinite(cafe.location?.lng);
  const googleMapsHref = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${cafe.location.lat},${cafe.location.lng}`
    : undefined;
  const directionsHref = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${cafe.location.lat},${cafe.location.lng}`
    : undefined;
  const hasAmenities = cafe.wifi || cafe.workingSpace;

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(cafe.specialDrinks.length > 0 ? [{ id: "specialties", label: td("coffeeSpecialties") }] : []),
    ...(cafe.menuHighlights.length > 0 || cafe.menuPdfUrl ? [{ id: "menu", label: td("menuHighlights") }] : []),
    ...(cafe.gallery.length > 0 ? [{ id: "gallery", label: t("gallery") }] : []),
    ...(hasAmenities ? [{ id: "amenities", label: t("amenities") }] : []),
    { id: "reviews", label: t("reviews") },
    { id: "location", label: td("location") },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: cafe.name,
    description: cafe.shortDescription,
    image: cafe.coverImage,
    logo: cafe.logo,
    address: { "@type": "PostalAddress", streetAddress: cafe.address, addressLocality: "Hargeisa" },
    telephone: cafe.phone,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: cafe.rating,
      reviewCount: cafe.reviewCount,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ViewTracker listingType="cafe" listingId={cafe.id} />

      <Breadcrumbs
        items={[
          { label: tNav("cafes"), href: `/${locale}/cafes` },
          { label: cafe.name, href: `/${locale}/cafes/${cafe.slug}` },
        ]}
      />

      <HotelHeaderTop
        logo={cafe.logo}
        name={cafe.name}
        rating={cafe.rating}
        reviewCount={cafe.reviewCount}
        categoryLabel="Cafe"
      />

      <HotelActionBar
        listingType="cafe"
        listingId={cafe.id}
        name={cafe.name}
        phone={cafe.phone}
        whatsappFallback={whatsappFallback}
        showPrimary={false}
      />

      <CafeQuickInfoCards rating={cafe.rating} openingHours={cafe.openingHours} wifi={cafe.wifi} workingSpace={cafe.workingSpace} />

      <HotelGallerySlider cover={cafe.coverImage} images={cafe.gallery} alt={cafe.name} />

      <div className="mt-8">
        <HotelNavTabs tabs={navTabs} />
      </div>

      <div className="container-px mx-auto grid gap-10 pb-28 pt-10 lg:grid-cols-3 lg:gap-12 lg:pb-10">
        <div className="space-y-14 lg:col-span-2">
          <Reveal>
            <section id="overview" aria-labelledby="overview-heading" className="scroll-mt-36">
              <h2 id="overview-heading" className="mb-5 font-display text-2xl font-semibold">
                {td("overview")}
              </h2>
              <p className="leading-relaxed text-ink/75 dark:text-sand/75">{cafe.description}</p>
            </section>
          </Reveal>

          {cafe.specialDrinks.length > 0 && (
            <Reveal>
              <section id="specialties" aria-labelledby="specialties-heading" className="scroll-mt-36">
                <h2 id="specialties-heading" className="mb-5 font-display text-2xl font-semibold">
                  {td("coffeeSpecialties")}
                </h2>
                <ul className="flex flex-wrap gap-2.5">
                  {cafe.specialDrinks.map((drink) => (
                    <li
                      key={drink}
                      className="inline-flex items-center gap-2 rounded-xl2 border border-ink/8 bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.03] dark:text-sand"
                    >
                      {drink}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}

          {(cafe.menuHighlights.length > 0 || cafe.menuPdfUrl) && (
            <Reveal>
              <section id="menu" aria-labelledby="menu-heading" className="scroll-mt-36">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 id="menu-heading" className="font-display text-2xl font-semibold">
                    {td("menuHighlights")}
                  </h2>
                  {cafe.menuPdfUrl && (
                    <a
                      href={cafe.menuPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
                    >
                      <FileText size={14} aria-hidden="true" />
                      Download PDF Menu
                    </a>
                  )}
                </div>
                {cafe.menuHighlights.length > 0 && (
                  <div className="divide-y divide-ink/8 overflow-hidden rounded-xl2 border border-ink/8 dark:divide-white/10 dark:border-white/10">
                    {cafe.menuHighlights.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-4 p-4 sm:p-5">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold sm:text-base">{item.name}</p>
                          {item.description && (
                            <p className="mt-1 text-xs text-ink/55 dark:text-sand/55 sm:text-sm">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 font-display text-sm font-bold text-primary sm:text-base">
                          {item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </Reveal>
          )}

          {cafe.gallery.length > 0 && (
            <Reveal>
              <section id="gallery" aria-labelledby="photo-gallery-heading" className="scroll-mt-36">
                <h2 id="photo-gallery-heading" className="mb-5 font-display text-2xl font-semibold">
                  {th("photoGallery")}
                </h2>
                <BusinessPhotoGallery images={cafe.gallery} alt={cafe.name} categories={CAFE_GALLERY_CATEGORIES} />
              </section>
            </Reveal>
          )}

          {hasAmenities && (
            <Reveal>
              <section id="amenities" aria-labelledby="amenities-heading" className="scroll-mt-36">
                <h2 id="amenities-heading" className="mb-5 font-display text-2xl font-semibold">
                  {t("amenities")}
                </h2>
                <ul className="flex flex-wrap gap-2.5">
                  {cafe.wifi && (
                    <li className="inline-flex items-center gap-2 rounded-xl2 border border-ink/8 bg-white px-3.5 py-2.5 text-sm font-medium text-ink dark:border-white/10 dark:bg-white/[0.03] dark:text-sand">
                      <Wifi size={16} className="shrink-0 text-primary" aria-hidden="true" />
                      {td("freeWifi")}
                    </li>
                  )}
                  {cafe.workingSpace && (
                    <li className="inline-flex items-center gap-2 rounded-xl2 border border-ink/8 bg-white px-3.5 py-2.5 text-sm font-medium text-ink dark:border-white/10 dark:bg-white/[0.03] dark:text-sand">
                      <Laptop size={16} className="shrink-0 text-primary" aria-hidden="true" />
                      {td("workingSpace")}
                    </li>
                  )}
                </ul>
              </section>
            </Reveal>
          )}

          <Reveal>
            <section id="location" aria-labelledby="location-heading" className="scroll-mt-36">
              <h2 id="location-heading" className="mb-5 font-display text-2xl font-semibold">
                {td("location")}
              </h2>
              <div className="overflow-hidden rounded-xl3 border border-ink/8 dark:border-white/10">
                <SingleLocationMapLoader location={cafe.location} label={cafe.name} />
                <div className="flex flex-col gap-3 border-t border-ink/8 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-sm text-ink/70 dark:text-sand/70">
                    <MapPin size={16} className="shrink-0 text-primary" aria-hidden="true" />
                    {cafe.address}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {directionsHref && (
                      <a
                        href={directionsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                      >
                        <Navigation size={14} aria-hidden="true" />
                        {th("directions")}
                      </a>
                    )}
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
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-36">
              <h2 id="reviews-heading" className="mb-5 font-display text-2xl font-semibold">
                {t("reviews")}
              </h2>
              <ReviewsSection rating={cafe.rating} reviewCount={cafe.reviewCount} reviews={cafe.reviews} />
              <div className="mt-6">
                <ReviewForm
                  listingType="cafe"
                  listingId={cafe.id}
                  locale={locale}
                  pathToRevalidate={`/${locale}/cafes/${cafe.slug}`}
                  allowPhotos
                />
              </div>
            </section>
          </Reveal>
        </div>

        <aside className="hidden h-fit rounded-xl3 border border-ink/8 p-6 shadow-card dark:border-white/10 lg:sticky lg:top-24 lg:block">
          <CafeActionCard
            cafeId={cafe.id}
            name={cafe.name}
            openingHours={cafe.openingHours}
            hoursLabel={t("openingHours")}
            phone={cafe.phone}
            locale={locale}
          />
        </aside>
      </div>

      {similarCafes.length > 0 && (
        <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{td("youMayAlsoLike")}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
                {similarCafes.map((c) => (
                  <div key={c.id} className="min-w-[272px] sm:min-w-0">
                    <ListingCard
                      href={`/${locale}/cafes/${c.slug}`}
                      image={c.coverImage}
                      title={c.name}
                      subtitle={c.address}
                      rating={c.rating}
                      reviewCount={c.reviewCount}
                      listingType="cafe"
                      listingId={c.id}
                      locale={locale}
                      tag={c.wifi ? td("freeWifi") : undefined}
                    />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <MobileBookingBar
        listingType="cafe"
        listingId={cafe.id}
        name={cafe.name}
        phone={cafe.phone}
        whatsappFallback={whatsappFallback}
        locale={locale}
        showPrimary={false}
      />
    </>
  );
}
