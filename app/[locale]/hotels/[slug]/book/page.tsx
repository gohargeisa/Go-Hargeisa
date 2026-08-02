import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getHotelBySlug } from "@/lib/data/hotels";
import { getHotelBookingCta } from "@/lib/utils/booking-cta";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { BookingForm } from "@/components/shared/booking-form";
import { HOTELS_PRESENTATION_MODE, PRESENTATION_HOTEL_SLUG } from "@/lib/config/features";

export async function generateMetadata({
  params: { slug },
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const hotel = await getHotelBySlug(slug);
  if (!hotel) return {};
  return { title: `Book ${hotel.name} — Go Hargeisa`, robots: { index: false } };
}

export default async function HotelBookingPage({
  params: { locale, slug },
  searchParams,
}: {
  params: { locale: Locale; slug: string };
  searchParams: { room?: string };
}) {
  const hotel = await getHotelBySlug(slug);
  if (!hotel) notFound();
  if (HOTELS_PRESENTATION_MODE && slug !== PRESENTATION_HOTEL_SLUG) notFound();

  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");

  const cta = getHotelBookingCta(hotel, {
    bookNow: t("bookNow"),
    bookOnWebsite: t("bookOnWebsite"),
    bookViaWhatsApp: t("bookViaWhatsApp"),
    bookOnBookingCom: t("bookOnBookingCom"),
  });

  // External-mode hotels have nothing for this page to collect — send
  // guests straight to the hotel's own booking channel instead.
  if (cta.kind === "external") redirect(`/${locale}/hotels/${hotel.slug}`);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: tNav("hotels"), href: `/${locale}/hotels` },
          { label: hotel.name, href: `/${locale}/hotels/${hotel.slug}` },
          { label: td("bookThisHotel"), href: `/${locale}/hotels/${hotel.slug}/book` },
        ]}
      />

      <section className="container-px mx-auto pb-16 pt-4 sm:pt-6">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-premium dark:border-white/10 dark:bg-ink">
          <BookingForm
            locale={locale}
            hotelId={hotel.id}
            hotelName={hotel.name}
            hotelRating={hotel.rating}
            rooms={hotel.rooms}
            preselectedRoomId={searchParams.room}
            whatsappNumber={cta.kind === "whatsapp" ? cta.whatsappNumber : undefined}
          />
        </div>
      </section>
    </>
  );
}
