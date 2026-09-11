import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { safeJsonLd } from "@/lib/utils/json-ld";
import {
  Phone,
  CalendarCheck,
  CreditCard,
  Truck,
  ClipboardCheck,
  Clock,
  Wallet,
  MapPin,
  Sun,
  Utensils,
  CalendarHeart,
  Moon,
  Users,
  Briefcase,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Restaurant, Product, Review, BusinessOffer } from "@/types";
import { Reveal } from "@/components/home/reveal";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ViewTracker } from "@/components/shared/view-tracker";
import { MobileBookingBar } from "@/components/shared/mobile-booking-bar";
import { TableReservationButton } from "@/components/shared/table-reservation-button";
import { LocationMapSection } from "@/components/shared/location-map-section";
import { SocialLinks } from "@/components/shared/social-links";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import { HotelNavTabs, type HotelNavTab } from "@/components/shared/hotel-nav-tabs";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { ShareButton } from "@/components/shared/share-button";
import { AddToTripButton } from "@/components/shared/add-to-trip-button";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { ListingOffersSection } from "@/components/shared/listing-offers-section";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import type { AddToCartBusiness } from "@/lib/cart/cart-context";
import { ExcellenceCafeHero } from "./excellence-cafe-hero";
import { ExcellenceCafeFeatured } from "./excellence-cafe-featured";
import { TextFirstMenuSection } from "@/components/shared/text-first-menu-section";
import { ExcellenceCafeBuffet } from "./excellence-cafe-buffet";
import { ExcellenceCafeGallery } from "./excellence-cafe-gallery";
import { ExcellenceCafeStory } from "./excellence-cafe-story";
import { ExcellenceCafeStickyBar } from "./excellence-cafe-sticky-bar";
import { EXCELLENCE_CAFE_DRINKS_SHOWCASE } from "@/lib/config/excellence-cafe-photos";
import { humanizePhotoKey } from "@/lib/utils/humanize-photo-key";

// The restaurant's own printed-menu section order (see lib/data/
// excellence-cafe-menu-seed.ts) — not alphabetical. Any category present in
// the data but missing here still renders, appended after these (see
// TextFirstMenuSection's own fallback-to-first-appearance-order behavior).
const EXCELLENCE_CAFE_CATEGORY_ORDER = [
  "Breakfast",
  "Main Courses",
  "Pastas",
  "Kids Menu",
  "Burgers",
  "Sandwiches",
  "Wraps",
  "Pizza",
  "Salads",
  "Dessert",
  "Coffee",
  "Iced Coffee",
  "Tea",
  "Frappes",
];

// Global fixed header (5rem) + the sticky HotelNavTabs bar (~3rem) — the
// menu's own category rail tucks directly beneath both instead of colliding
// with them at the same `top`.
const MENU_CATEGORY_NAV_TOP_PX = 128;

// Verified from Excellence Café's own social channels + its public
// Tripadvisor listing (Lebanese / Mediterranean / Turkish / Arabic / Café /
// Pizza) plus the Somali dishes on its own menu (camel suqaar w/ shuuro,
// whole grilled fish). Kept here as component copy rather than written to
// `restaurants.cuisine` — the listing migration deliberately left that DB
// column blank pending the owner's own confirmation, and this pass does not
// change that. Used only for the Schema.org `servesCuisine` hint.
const EXCELLENCE_CAFE_SERVES_CUISINE = [
  "Lebanese",
  "Mediterranean",
  "Turkish",
  "Arabic",
  "Somali",
  "Cafe",
  "Pizza",
] as const;

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.22em] text-primary-700 dark:text-primary-300">
      {children}
    </span>
  );
}

/** One consistent section header for the whole page — a wide-tracked eyebrow
 * over a restrained serif title. Keeps every section speaking the same
 * typographic language the (approved) hero established, without the
 * oversized display sizes. */
function SectionHeader({
  eyebrow,
  title,
  center = false,
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  center?: boolean;
  dark?: boolean;
}) {
  return (
    <div className={center ? "text-center" : undefined}>
      {eyebrow && (
        <span
          className={`mb-2.5 block text-[11px] font-bold uppercase tracking-[0.22em] ${
            dark ? "text-primary-300" : "text-primary-700 dark:text-primary-300"
          }`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`font-display text-[1.7rem] font-semibold leading-tight tracking-tight sm:text-[2.05rem] ${
          dark ? "text-white" : ""
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

/**
 * Excellence Café — dedicated premium restaurant experience. Rendered from
 * the public restaurants/[slug] route (a slug branch there, mirroring The
 * Village Hargeisa) and from its own private preview route. Reuses the
 * shared cart / ProductDetailModal / TableReservationButton / reviews /
 * favourites / map stack — no parallel systems, same discipline as
 * components/the-village/the-village-experience.tsx.
 *
 * `offers` / `myReview` / `isFavorited` / `whatsappFallback` are optional so
 * the private preview route (which has no per-visitor engagement data) can
 * keep passing just `{ locale, restaurant, products }`; the public route
 * passes the real values fetched by restaurants/[slug]/page.tsx.
 */
export async function ExcellenceCafeExperience({
  locale,
  restaurant,
  products,
  offers = [],
  myReview = null,
  isFavorited = false,
  whatsappFallback,
}: {
  locale: Locale;
  restaurant: Restaurant;
  products: Product[];
  offers?: BusinessOffer[];
  myReview?: Review | null;
  isFavorited?: boolean;
  whatsappFallback?: string;
}) {
  const t = await getTranslations({ locale, namespace: "excellenceCafe" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const td = await getTranslations({ locale, namespace: "detail" });
  const tl = await getTranslations({ locale, namespace: "listings" });

  // The listing's stored lat/lng are an explicit PLACEHOLDER (Hargeisa
  // city-centre) — no verified GPS was supplied, so we must never drop a
  // pin there. Link "Open in Google Maps" to a NAME + verified-address
  // SEARCH instead (resolves to the real venue on Google's side), and pass
  // no `coords` to LocationMapSection below so it shows the address as text
  // only, never a misleading embedded pin.
  const mapsHref =
    restaurant.googleMapsUrl ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Excellence Café, ${restaurant.address}`)}`;
  const telHref = restaurant.phone ? `tel:${restaurant.phone.replace(/\s/g, "")}` : undefined;
  const whatsappNumber = restaurant.whatsapp ?? whatsappFallback;
  const whatsappHref = whatsappNumber ? toWhatsAppHref(whatsappNumber, t("whatsappGreeting")) : undefined;
  const pathToRevalidate = `/${locale}/restaurants/${restaurant.slug}`;

  const business: AddToCartBusiness = {
    listingType: "restaurant",
    listingId: restaurant.id,
    businessName: restaurant.name,
    deliveryEnabled: Boolean(restaurant.productsDeliveryEnabled),
    addons: [],
    whatsapp: whatsappNumber,
  };

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(products.length > 0 ? [{ id: "menu", label: td("orderOnline") }] : []),
    ...(restaurant.reservable ? [{ id: "reservation", label: tc("reserveTable") }] : []),
    { id: "reviews", label: tc("reviews") },
    { id: "location", label: td("location") },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: t("metaDescription"),
    image: restaurant.coverImage,
    logo: restaurant.logo,
    url: `https://gohargeisa.com${pathToRevalidate}`,
    address: { "@type": "PostalAddress", streetAddress: restaurant.address, addressLocality: "Hargeisa", addressRegion: "Maroodi Jeex", addressCountry: "Somaliland" },
    telephone: restaurant.phone,
    priceRange: restaurant.priceRange,
    servesCuisine: [...EXCELLENCE_CAFE_SERVES_CUISINE],
    acceptsReservations: restaurant.reservable ? "https://gohargeisa.com/en/restaurants/excellence-cafe#reservation" : undefined,
    hasMenu: `${pathToRevalidate}#menu`,
    hasMap: mapsHref,
    // Verified only: payment methods from the owner's supplied info; the
    // features below are each visible in the owner's own photo set
    // (air-conditioned dining room, daily buffet) or stated in supplied info
    // (table reservations, taxi delivery, takeaway/dine-in).
    paymentAccepted: "Cash, Zaad, eDahab, Premier Cash",
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Outdoor seating", value: true },
      { "@type": "LocationFeatureSpecification", name: "Air conditioning", value: true },
      { "@type": "LocationFeatureSpecification", name: "Daily lunch buffet", value: true },
      { "@type": "LocationFeatureSpecification", name: "Table reservations", value: true },
      { "@type": "LocationFeatureSpecification", name: "Takeaway", value: true },
      { "@type": "LocationFeatureSpecification", name: "Delivery", value: true },
    ],
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "07:00",
      closes: "24:00",
    },
    ...(restaurant.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: restaurant.rating, reviewCount: restaurant.reviewCount } }
      : {}),
    ...(restaurant.socialInstagram || restaurant.socialTiktok || restaurant.socialFacebook
      ? { sameAs: [restaurant.socialInstagram, restaurant.socialTiktok, restaurant.socialFacebook].filter(Boolean) }
      : {}),
  };

  const infoRows: { icon: typeof Clock; label: string; value: string }[] = [
    { icon: Clock, label: tc("openingHours"), value: restaurant.openingHours },
    { icon: Wallet, label: tc("priceRange"), value: restaurant.priceRange },
    { icon: MapPin, label: td("location"), value: restaurant.address },
  ];

  // "Good to know" — verified facilities only. The covered garden terrace,
  // air-conditioned indoor hall and daily buffet are all visible in the
  // owner's own (watermarked) photo set; the rest are stated in the
  // business's supplied information (table reservations, all-day hours, taxi
  // delivery, mobile-money + cash payment). Nothing here is inferred from an
  // unclaimed third-party listing.
  const facilities: string[] = [
    t("facilityBuffet"),
    t("facilityTerrace"),
    t("facilityAirCon"),
    t("facilityAllDay"),
    t("facilityReservations"),
    t("facilityDelivery"),
    t("facilityPayments"),
  ];

  // Occasions the room is set up for — drawn from the business's supplied
  // info (birthdays, family gatherings, Iftar, private group buffets) plus
  // the plainly-supported everyday uses of an all-day café.
  const occasions: { icon: typeof Sun; label: string; body: string }[] = [
    { icon: Sun, label: t("occasionBreakfastLabel"), body: t("occasionBreakfastBody") },
    { icon: Briefcase, label: t("occasionLunchLabel"), body: t("occasionLunchBody") },
    { icon: Moon, label: t("occasionDinnerLabel"), body: t("occasionDinnerBody") },
    { icon: CalendarHeart, label: t("occasionCelebrationLabel"), body: t("occasionCelebrationBody") },
    { icon: Users, label: t("occasionGroupLabel"), body: t("occasionGroupBody") },
    { icon: Utensils, label: t("occasionIftarLabel"), body: t("occasionIftarBody") },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ViewTracker listingType="restaurant" listingId={restaurant.id} />

      <Breadcrumbs
        items={[
          { label: tNav("restaurants"), href: `/${locale}/restaurants` },
          { label: restaurant.name, href: pathToRevalidate },
        ]}
      />

      <ExcellenceCafeHero restaurant={restaurant} locale={locale} mapsHref={mapsHref} />

      <HotelNavTabs tabs={navTabs} />

      {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
      <section id="overview" className="container-px mx-auto max-w-6xl py-14 sm:py-20" style={{ scrollMarginTop: MENU_CATEGORY_NAV_TOP_PX }}>
        <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <Reveal>
            <div>
              <SectionHeader eyebrow={t("introEyebrow")} title={t("introHeading")} />
              <p dir="auto" className="mt-5 text-[15px] leading-[1.75] text-ink/75 dark:text-sand/75">
                {t("aboutBody")}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                <FavoriteButton
                  listingType="restaurant"
                  listingId={restaurant.id}
                  locale={locale}
                  initiallyFavorited={isFavorited}
                  redirectPath={pathToRevalidate}
                  addLabel={tl("addToFavorites", { name: restaurant.name })}
                  removeLabel={tl("removeFromFavorites", { name: restaurant.name })}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/12 text-ink/60 transition-colors hover:border-primary hover:text-primary dark:border-white/12 dark:text-sand/60"
                />
                <AddToTripButton locale={locale} listingType="restaurant" listingId={restaurant.id} />
                <ShareButton title={restaurant.name} />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white dark:border-white/10 dark:bg-white/[0.02]">
              <dl className="divide-y divide-ink/8 dark:divide-white/10">
                {infoRows.map((row) => (
                  <div key={row.label} className="flex items-start gap-3.5 px-5 py-4">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary-700 dark:bg-primary/15 dark:text-primary-300">
                      <row.icon size={15} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">{row.label}</dt>
                      <dd dir="auto" className="mt-0.5 text-sm font-medium leading-snug">{row.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              <div className="flex flex-col divide-y divide-ink/8 border-t border-ink/8 dark:divide-white/10 dark:border-white/10">
                {telHref && (
                  <a href={telHref} dir="ltr" className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition-colors hover:bg-primary/5 hover:text-primary dark:hover:bg-white/[0.04]">
                    <Phone size={15} className="shrink-0 text-ink/45 dark:text-sand/45" aria-hidden="true" />
                    {t("contactCall")}
                    <span dir="auto" className="ms-auto text-xs font-normal text-ink/45 dark:text-sand/45">{restaurant.phone}</span>
                  </a>
                )}
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition-colors hover:bg-primary/5 hover:text-primary dark:hover:bg-white/[0.04]">
                    <WhatsAppIcon size={15} aria-hidden="true" />
                    {t("contactWhatsApp")}
                  </a>
                )}
                <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition-colors hover:bg-primary/5 hover:text-primary dark:hover:bg-white/[0.04]">
                  <MapPin size={15} className="shrink-0 text-ink/45 dark:text-sand/45" aria-hidden="true" />
                  {t("heroDirections")}
                </a>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Verified-facts-only service notes (delivery method, reservation
            channel, payment methods) — component-level copy sourced directly
            from the business owner's supplied information, no DB column for
            this free text. */}
        <Reveal delay={0.1}>
          <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/8 dark:border-white/10 dark:bg-white/10 sm:grid-cols-3">
            {[
              { icon: Truck, label: t("servicesDeliveryLabel"), body: t("servicesDeliveryBody") },
              { icon: ClipboardCheck, label: t("servicesReservationsLabel"), body: t("servicesReservationsBody") },
              { icon: CreditCard, label: t("servicesPaymentLabel"), body: t("servicesPaymentBody") },
            ].map((item) => (
              <div key={item.label} className="bg-white p-5 dark:bg-ink">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">
                  <item.icon size={13} aria-hidden="true" />
                  {item.label}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink/75 dark:text-sand/75">{item.body}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* Good to know — verified facilities only (see `facilities` above). */}
        <Reveal delay={0.12}>
          <div className="mt-6">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">{t("facilitiesLabel")}</p>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {facilities.map((f) => (
                <li
                  key={f}
                  dir="auto"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1.5 text-[13px] font-medium text-primary-800 dark:bg-primary/15 dark:text-primary-200"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-600 dark:bg-primary-300" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* ── OUR STORY ──────────────────────────────────────────────── */}
      <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.02] sm:py-20">
        <div className="container-px mx-auto max-w-2xl">
          <Reveal>
            <SectionHeader eyebrow={t("storyEyebrow")} title={t("storyHeading")} center />
          </Reveal>
          <Reveal delay={0.05}>
            <div className="mt-7 space-y-5 text-[15px] leading-[1.8] text-ink/75 dark:text-sand/75">
              <p dir="auto">{t("storyBody1")}</p>
              <p dir="auto">{t("storyBody2")}</p>
            </div>
            <p dir="auto" className="mt-7 border-s-2 border-primary/40 ps-4 text-[15px] font-medium leading-relaxed text-ink/80 dark:text-sand/80">
              {t("whyVisitBody")}
            </p>
          </Reveal>
        </div>
      </section>

      {offers.length > 0 && (
        <section className="container-px mx-auto max-w-6xl pb-4">
          <Reveal>
            <ListingOffersSection
              offers={offers}
              title={td("offersTabLabel")}
              couponLabel={td("offerCouponCodeLabel")}
              validUntilLabel={(date) => td("offerValidUntil", { date })}
              saveLabel={(amount) => td("offerSave", { amount })}
              percentOffLabel={(pct) => td("offerPercentOff", { pct })}
            />
          </Reveal>
        </section>
      )}

      {/* Featured Dishes */}
      <section className="border-y border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.02] sm:py-[4.5rem]">
        <div className="container-px mx-auto max-w-6xl">
          <Reveal>
            <div className="mb-9">
              <SectionHeader eyebrow={t("featuredEyebrow")} title={t("featuredHeading")} center />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <ExcellenceCafeFeatured />
          </Reveal>
        </div>
      </section>

      {/* ── THE DINING EXPERIENCE (visual story — the space, buffet, coffee) ── */}
      <ExcellenceCafeStory locale={locale} />

      {/* ── CUISINE & SPECIALTIES ───────────────────────────────────── */}
      <section className="container-px mx-auto max-w-4xl py-14 sm:py-20">
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <Reveal>
            <div>
              <SectionHeader eyebrow={t("cuisineEyebrow")} title={t("cuisineHeading")} />
              <p dir="auto" className="mt-5 text-[15px] leading-[1.8] text-ink/75 dark:text-sand/75">{t("cuisineBody")}</p>
              <p className="mt-6 text-[11px] font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">{t("cuisineTagsLabel")}</p>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {t("cuisineTagList")
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <li
                      key={tag}
                      dir="auto"
                      className="rounded-full border border-ink/12 px-3 py-1 text-[13px] font-medium text-ink/70 dark:border-white/12 dark:text-sand/70"
                    >
                      {tag}
                    </li>
                  ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white dark:border-white/10 dark:bg-white/[0.02]">
              <div className="grid grid-cols-3 gap-px bg-ink/8 dark:bg-white/10">
                {EXCELLENCE_CAFE_DRINKS_SHOWCASE.map((photo) => (
                  <div key={photo.key} className="relative aspect-square bg-white dark:bg-ink">
                    <Image
                      src={photo.src}
                      alt={humanizePhotoKey(photo.key)}
                      fill
                      sizes="(max-width: 1023px) 30vw, 15vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="p-6 sm:p-7">
                <h3 className="font-display text-lg font-semibold tracking-tight">{t("drinksHeading")}</h3>
                <p dir="auto" className="mt-3 text-sm leading-relaxed text-ink/70 dark:text-sand/70">{t("drinksBody")}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SUITABLE OCCASIONS ─────────────────────────────────────── */}
      <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.02] sm:py-20">
        <div className="container-px mx-auto max-w-5xl">
          <Reveal>
            <div className="mb-9 text-center">
              <SectionHeader eyebrow={t("occasionsEyebrow")} title={t("occasionsHeading")} center />
              <p className="mx-auto mt-3.5 max-w-lg text-sm leading-relaxed text-ink/55 dark:text-sand/55">{t("occasionsIntro")}</p>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {occasions.map((o) => (
                <li
                  key={o.label}
                  className="flex items-start gap-3.5 rounded-2xl border border-ink/10 p-5 dark:border-white/10"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary-700 dark:bg-primary/15 dark:text-primary-300">
                    <o.icon size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p dir="auto" className="text-sm font-semibold">{o.label}</p>
                    <p dir="auto" className="mt-1 text-[13px] leading-relaxed text-ink/60 dark:text-sand/60">{o.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── ORDER ONLINE / MENU ──────────────────────────────────────── */}
      <section id="menu" className="container-px mx-auto max-w-5xl py-14 sm:py-20" style={{ scrollMarginTop: MENU_CATEGORY_NAV_TOP_PX }}>
        <Reveal>
          <div className="mb-9 text-center">
            <SectionHeader eyebrow={t("menuEyebrow")} title={t("menuHeading")} center />
            <p className="mx-auto mt-3.5 max-w-lg text-sm leading-relaxed text-ink/55 dark:text-sand/55">{t("menuIntro")}</p>
          </div>
        </Reveal>
        <TextFirstMenuSection
          products={products}
          business={business}
          locale={locale}
          storeName={restaurant.name}
          categoryOrder={EXCELLENCE_CAFE_CATEGORY_ORDER}
          stickyTopPx={MENU_CATEGORY_NAV_TOP_PX}
        />
      </section>

      {/* Daily Lunch Buffet */}
      <section className="border-y border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.02] sm:py-20">
        <div className="container-px mx-auto max-w-5xl">
          <Reveal>
            <ExcellenceCafeBuffet locale={locale} />
          </Reveal>
        </div>
      </section>

      {/* ── RESERVE A TABLE ──────────────────────────────────────────── */}
      {restaurant.reservable && (
        <section id="reservation" className="border-y border-white/10 bg-ink py-16 text-white sm:py-[4.5rem]" style={{ scrollMarginTop: MENU_CATEGORY_NAV_TOP_PX }}>
          <div className="container-px mx-auto max-w-xl text-center">
            <Reveal>
              <span className="mb-3 inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">
                <span className="h-px w-6 bg-primary-300/60" aria-hidden="true" />
                {t("reserveEyebrow")}
                <span className="h-px w-6 bg-primary-300/60" aria-hidden="true" />
              </span>
              <h2 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-white sm:text-[2.25rem]">
                {t("reserveHeading")}
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/65">{t("reserveBody")}</p>
              <div className="mt-9 flex justify-center">
                <TableReservationButton
                  listingType="restaurant"
                  listingId={restaurant.id}
                  businessName={restaurant.name}
                  locale={locale}
                  label={t("heroBookTable")}
                  icon={<CalendarCheck size={16} aria-hidden="true" />}
                  className="inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-full bg-primary-700 px-9 text-[15px] font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-95"
                />
              </div>
              {restaurant.phone && (
                <p dir="ltr" className="mt-5 text-[13px] text-white/45">
                  {t("contactCall")} · {restaurant.phone}
                </p>
              )}
            </Reveal>
          </div>
        </section>
      )}

      {/* ── REVIEWS ──────────────────────────────────────────────────── */}
      <section id="reviews" className="container-px mx-auto max-w-3xl py-14 sm:py-20" style={{ scrollMarginTop: MENU_CATEGORY_NAV_TOP_PX }}>
        <Reveal>
          <div className="mb-8 text-center">
            <SectionHeader eyebrow={t("reviewsEyebrow")} title={tc("reviews")} center />
            {restaurant.reviewCount === 0 && (
              <p className="mx-auto mt-3.5 max-w-md text-sm leading-relaxed text-ink/55 dark:text-sand/55">
                {t("reviewsEmptyBody")}
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-6 dark:border-white/10 dark:bg-white/[0.02] sm:p-8">
            <ReviewsSection
              rating={restaurant.rating}
              reviewCount={restaurant.reviewCount}
              reviews={restaurant.reviews}
              locale={locale}
              pathToRevalidate={pathToRevalidate}
            />
            <div className="mt-6 border-t border-ink/8 pt-6 dark:border-white/10">
              <ReviewForm
                key={myReview?.id ?? "new"}
                listingType="restaurant"
                listingId={restaurant.id}
                locale={locale}
                pathToRevalidate={pathToRevalidate}
                allowPhotos
                existingReview={myReview}
              />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── LOCATION ─────────────────────────────────────────────────── */}
      <div className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.02] sm:py-20">
        <div className="container-px mx-auto max-w-4xl">
          <Reveal>
            <div className="mb-8 text-center">
              <SectionHeader title={td("location")} center />
            </div>
          </Reveal>
          {/* coords/map left exactly as the live version has them — the
              stored lat/lng are a Hargeisa city-centre PLACEHOLDER (no
              verified GPS supplied), reported as UNVERIFIED rather than
              changed or guessed. "Open in Google Maps" now searches by
              name + verified address, so it resolves to the real venue. */}
          <LocationMapSection locale={locale} address={restaurant.address} coords={restaurant.location} mapsHref={mapsHref} name={restaurant.name} hideHeading />
        </div>
      </div>

      {/* Gallery */}
      <section className="border-t border-ink/8 py-14 sm:py-20">
        <div className="container-px mx-auto max-w-6xl">
          <Reveal>
            <div className="mb-9">
              <SectionHeader eyebrow={t("galleryEyebrow")} title={t("galleryHeading")} center />
            </div>
            <ExcellenceCafeGallery businessName={restaurant.name} ownerUploads={restaurant.gallery} />
          </Reveal>
        </div>
      </section>

      {/* Social Media */}
      {(restaurant.socialInstagram || restaurant.socialFacebook || restaurant.socialTiktok) && (
        <section className="border-t border-ink/8 bg-white py-12 text-center dark:border-white/10 dark:bg-white/[0.02] sm:py-14">
          <Reveal>
            <SectionEyebrow>{t("socialHeading")}</SectionEyebrow>
            <div className="mt-3.5 flex justify-center">
              <SocialLinks
                instagram={restaurant.socialInstagram}
                facebook={restaurant.socialFacebook}
                tiktok={restaurant.socialTiktok}
                labels={{ instagram: t("contactInstagram"), facebook: t("contactFacebook"), tiktok: t("contactTiktok") }}
              />
            </div>
          </Reveal>
        </section>
      )}

      {/* Final CTA */}
      <section className="border-t border-ink/8 py-16 text-center sm:py-20">
        <div className="container-px mx-auto max-w-xl">
          <Reveal>
            <SectionHeader title={t("finalCtaHeading")} center />
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink/60 dark:text-sand/60">{t("finalCtaBody")}</p>
            <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
              {restaurant.reservable && (
                <TableReservationButton
                  listingType="restaurant"
                  listingId={restaurant.id}
                  businessName={restaurant.name}
                  locale={locale}
                  label={t("heroBookTable")}
                  icon={<CalendarCheck size={16} aria-hidden="true" />}
                  className="inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-full bg-primary-700 px-8 text-[15px] font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-95"
                />
              )}
              <a
                href="#menu"
                className="inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-full border border-ink/15 px-8 text-[15px] font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
              >
                {t("heroViewMenu")}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <MobileBookingBar
        listingType="restaurant"
        listingId={restaurant.id}
        name={restaurant.name}
        phone={restaurant.phone}
        whatsappFallback={whatsappFallback}
        locale={locale}
      />
      <ExcellenceCafeStickyBar
        listingId={restaurant.id}
        businessName={restaurant.name}
        reservable={restaurant.reservable}
        locale={locale}
      />
    </>
  );
}
