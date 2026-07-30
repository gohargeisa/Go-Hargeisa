import { safeJsonLd } from "@/lib/utils/json-ld";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExternalLink, FileText, MapPin, Navigation } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getRestaurantBySlug, getAllRestaurantSlugs, getRestaurants } from "@/lib/data/restaurants";
import { getSiteSettings } from "@/lib/actions/settings";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ViewTracker } from "@/components/shared/view-tracker";
import { HotelHeaderTop } from "@/components/shared/hotel-header-top";
import { HotelActionBar } from "@/components/shared/hotel-action-bar";
import { RestaurantQuickInfoCards } from "@/components/shared/restaurant-quick-info-cards";
import { HotelGallerySlider } from "@/components/shared/hotel-gallery-slider";
import { HotelNavTabs, type HotelNavTab } from "@/components/shared/hotel-nav-tabs";
import { BusinessPhotoGallery } from "@/components/shared/business-photo-gallery";
import { RESTAURANT_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { RestaurantBookingCard } from "@/components/shared/restaurant-booking-card";
import { MobileBookingBar } from "@/components/shared/mobile-booking-bar";
import { ListingCard } from "@/components/shared/listing-card";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { SingleLocationMapLoader } from "@/components/map/single-location-map-loader";
import { Reveal } from "@/components/home/reveal";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
import { listingCategoryLabel } from "@/lib/utils/hotel-category";

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
  if (!r) return {};
  return {
    title: `${r.name} — Restaurant in Hargeisa`,
    description: r.shortDescription,
    openGraph: { images: [r.coverImage] },
    alternates: localeAlternates(locale as Locale, `/restaurants/${r.slug}`),
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
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");
  const th = await getTranslations("hotelDetail");
  const [allRestaurants, siteSettings] = await Promise.all([getRestaurants(), getSiteSettings()]);
  const similarRestaurants = allRestaurants.filter((r) => r.id !== restaurant.id).slice(0, 4);
  const whatsappFallback = (siteSettings as { whatsapp_number?: string } | null)?.whatsapp_number ?? undefined;

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(restaurant.menuHighlights.length > 0 || restaurant.menuPdfUrl ? [{ id: "menu", label: td("menuHighlights") }] : []),
    ...(restaurant.gallery.length > 0 ? [{ id: "gallery", label: t("gallery") }] : []),
    { id: "reviews", label: t("reviews") },
    { id: "location", label: td("location") },
  ];

  const hasCoordinates =
    Number.isFinite(restaurant.location?.lat) && Number.isFinite(restaurant.location?.lng);
  const googleMapsHref = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${restaurant.location.lat},${restaurant.location.lng}`
    : undefined;
  const directionsHref = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}`
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.shortDescription,
    image: restaurant.coverImage,
    logo: restaurant.logo,
    address: { "@type": "PostalAddress", streetAddress: restaurant.address, addressLocality: "Hargeisa" },
    telephone: restaurant.phone,
    servesCuisine: restaurant.cuisine,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: restaurant.rating,
      reviewCount: restaurant.reviewCount,
    },
    priceRange: restaurant.priceRange,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ViewTracker listingType="restaurant" listingId={restaurant.id} />

      <Breadcrumbs
        items={[
          { label: tNav("restaurants"), href: `/${locale}/restaurants` },
          { label: restaurant.name, href: `/${locale}/restaurants/${restaurant.slug}` },
        ]}
      />

      <HotelHeaderTop
        logo={restaurant.logo}
        name={restaurant.name}
        rating={restaurant.rating}
        reviewCount={restaurant.reviewCount}
        categoryLabel={listingCategoryLabel(restaurant.priceRange, "Restaurant")}
      />

      <HotelActionBar
        locale={locale}
        listingType="restaurant"
        listingId={restaurant.id}
        name={restaurant.name}
        phone={restaurant.phone}
        website={restaurant.website}
        whatsappFallback={whatsappFallback}
        showPrimary={restaurant.reservable}
        primaryLabel={t("reserveTable")}
      />

      <RestaurantQuickInfoCards
        rating={restaurant.rating}
        priceRange={restaurant.priceRange}
        cuisine={restaurant.cuisine}
        openingHours={restaurant.openingHours}
        reservable={restaurant.reservable}
      />

      <HotelGallerySlider cover={restaurant.coverImage} images={restaurant.gallery} alt={restaurant.name} />

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
              <p className="leading-relaxed text-ink/75 dark:text-sand/75">{restaurant.description}</p>
            </section>
          </Reveal>

          {(restaurant.menuHighlights.length > 0 || restaurant.menuPdfUrl) && (
            <Reveal>
              <section id="menu" aria-labelledby="menu-heading" className="scroll-mt-36">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 id="menu-heading" className="font-display text-2xl font-semibold">
                    {td("menuHighlights")}
                  </h2>
                  {restaurant.menuPdfUrl && (
                    <SecondaryButton href={restaurant.menuPdfUrl} external size="sm">
                      <FileText size={14} aria-hidden="true" />
                      {td("downloadMenuPdf")}
                    </SecondaryButton>
                  )}
                </div>
                {restaurant.menuHighlights.length > 0 && (
                  <div className="divide-y divide-ink/8 overflow-hidden rounded-xl2 border border-ink/8 dark:divide-white/10 dark:border-white/10">
                    {restaurant.menuHighlights.map((item) => (
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

          {restaurant.gallery.length > 0 && (
            <Reveal>
              <section id="gallery" aria-labelledby="photo-gallery-heading" className="scroll-mt-36">
                <h2 id="photo-gallery-heading" className="mb-5 font-display text-2xl font-semibold">
                  {th("photoGallery")}
                </h2>
                <BusinessPhotoGallery
                  images={restaurant.gallery}
                  alt={restaurant.name}
                  categories={RESTAURANT_GALLERY_CATEGORIES}
                />
              </section>
            </Reveal>
          )}

          <Reveal>
            <section id="location" aria-labelledby="location-heading" className="scroll-mt-36">
              <h2 id="location-heading" className="mb-5 font-display text-2xl font-semibold">
                {td("location")}
              </h2>
              <div className="overflow-hidden rounded-xl3 border border-ink/8 dark:border-white/10">
                <SingleLocationMapLoader location={restaurant.location} label={restaurant.name} />
                <div className="flex flex-col gap-3 border-t border-ink/8 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-sm text-ink/70 dark:text-sand/70">
                    <MapPin size={16} className="shrink-0 text-primary" aria-hidden="true" />
                    {restaurant.address}
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
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-36">
              <h2 id="reviews-heading" className="mb-5 font-display text-2xl font-semibold">
                {t("reviews")}
              </h2>
              <ReviewsSection rating={restaurant.rating} reviewCount={restaurant.reviewCount} reviews={restaurant.reviews} />
              <div className="mt-6">
                <ReviewForm
                  listingType="restaurant"
                  listingId={restaurant.id}
                  locale={locale}
                  pathToRevalidate={`/${locale}/restaurants/${restaurant.slug}`}
                  allowPhotos
                />
              </div>
            </section>
          </Reveal>
        </div>

        <aside className="hidden h-fit rounded-xl3 border border-ink/8 p-6 shadow-card dark:border-white/10 lg:sticky lg:top-24 lg:block">
          <RestaurantBookingCard
            restaurantId={restaurant.id}
            name={restaurant.name}
            priceRange={restaurant.priceRange}
            priceLabel={t("priceRange")}
            openingHours={restaurant.openingHours}
            hoursLabel={t("openingHours")}
            reservable={restaurant.reservable}
            reserveLabel={t("reserveTable")}
            phone={restaurant.phone}
            website={restaurant.website}
            locale={locale}
            contactLabel={tNav("contact")}
            visitWebsiteLabel={th("website")}
          />
        </aside>
      </div>

      {similarRestaurants.length > 0 && (
        <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{td("youMayAlsoLike")}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
                {similarRestaurants.map((r) => (
                  <div key={r.id} className="min-w-[272px] sm:min-w-0">
                    <ListingCard
                      href={`/${locale}/restaurants/${r.slug}`}
                      image={r.coverImage}
                      title={r.name}
                      subtitle={r.cuisine.join(" · ")}
                      rating={r.rating}
                      reviewCount={r.reviewCount}
                      priceRange={r.priceRange}
                      listingType="restaurant"
                      listingId={r.id}
                      locale={locale}
                    />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <MobileBookingBar
        listingType="restaurant"
        listingId={restaurant.id}
        name={restaurant.name}
        phone={restaurant.phone}
        website={restaurant.website}
        whatsappFallback={whatsappFallback}
        locale={locale}
        showPrimary={restaurant.reservable}
        primaryLabel={t("reserveTable")}
      />
    </>
  );
}
