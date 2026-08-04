import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { PremiumSectionHeading } from "@/components/shared/premium-section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { ListingCard } from "@/components/shared/listing-card";
import { getEvents } from "@/lib/data/events";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";

export const revalidate = 3600;

/** Reuses the shared hero photo — same swap-in-place pattern as city-services/page.tsx. */
const EVENTS_HERO_IMAGE = "/images/hero-bg.png";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Events in Hargeisa",
    description: "Cultural, national, business, sports and concert events happening in Hargeisa, Somaliland.",
    alternates: localeAlternates(locale as Locale, "/events"),
  };
}

export default async function EventsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale, namespace: "eventsPage" });
  const events = await getEvents();

  return (
    <>
      <PremiumPageHero
        image={EVENTS_HERO_IMAGE}
        imageAlt="Panoramic view of Hargeisa"
        eyebrow={t("eyebrow")}
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        scrollHint={t("scrollHint")}
      />

      <section className="container-px mx-auto py-10 md:py-14">
        {events.length === 0 ? (
          <EmptyState icon={CalendarDays} title={t("emptyTitle")} description={t("emptyDescription")} className="mt-4" />
        ) : (
          <>
            <PremiumSectionHeading title={t("sectionsTitle")} subtitle={t("sectionsSubtitle")} className="mb-10 md:mb-14" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <ListingCard
                  key={event.id}
                  href={`/${locale}/events/${event.slug}`}
                  image={event.coverImage}
                  title={event.title}
                  subtitle={event.location}
                  rating={event.rating}
                  reviewCount={event.reviewCount}
                  locale={locale}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
