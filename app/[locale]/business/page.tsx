import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Eye, Globe, Phone, MessageCircle, CalendarCheck, Star, ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import {
  getActiveListing,
  getKpiStats,
  getBookingsKpi,
  getViewsSeries,
  getBookingsForHotel,
  getReviewsForListing,
  type AnalyticsRange,
} from "@/lib/data/business";
import { KpiCard } from "@/components/business/kpi-card";
import { ViewsChart } from "@/components/business/views-chart";
import { ReviewCard } from "@/components/business/review-card";
import { PerformanceTips } from "@/components/business/performance-tips";

export const metadata: Metadata = { title: "Dashboard — Business", robots: { index: false } };

const RANGES: AnalyticsRange[] = ["7d", "30d", "90d", "12m"];

export default async function BusinessOverviewPage({ params: { locale } }: { params: { locale: Locale } }) {
  const redirectTo = `/${locale}/business`;
  const listing = await getActiveListing(locale, redirectTo);
  if (!listing) return null; // layout already renders the "no business" empty state

  const t = await getTranslations({ locale, namespace: "businessDashboard" });
  const isHotel = listing.listingType === "hotel";

  const [kpiStats, bookingsKpi, seriesEntries, bookings, reviews] = await Promise.all([
    getKpiStats(listing.listingType, listing.id),
    isHotel ? getBookingsKpi(listing.id) : Promise.resolve(null),
    Promise.all(RANGES.map(async (r) => [r, await getViewsSeries(listing.listingType, listing.id, r)] as const)),
    isHotel ? getBookingsForHotel(listing.id, 5) : Promise.resolve([]),
    getReviewsForListing(listing.listingType, listing.id),
  ]);

  const series = Object.fromEntries(seriesEntries) as Record<AnalyticsRange, Awaited<ReturnType<typeof getViewsSeries>>>;
  const kpiByType = Object.fromEntries(kpiStats.map((k) => [k.eventType, k]));
  const unrepliedReviewsCount = reviews.filter((r) => !r.ownerReply).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("greetingMorning") : hour < 18 ? t("greetingAfternoon") : t("greetingEvening");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{greeting} 👋</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("welcomeSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          icon={Eye}
          value={kpiByType.view?.today ?? 0}
          growthPercent={kpiByType.view?.growthPercent ?? null}
          label={t("kpiProfileViews")}
          subtitle={t("kpiTodaySubtitle")}
        />
        <KpiCard
          icon={Globe}
          value={kpiByType.website_click?.today ?? 0}
          growthPercent={kpiByType.website_click?.growthPercent ?? null}
          label={t("kpiWebsiteClicks")}
          subtitle={t("kpiTodaySubtitle")}
        />
        <KpiCard
          icon={Phone}
          value={kpiByType.call_click?.today ?? 0}
          growthPercent={kpiByType.call_click?.growthPercent ?? null}
          label={t("kpiPhoneCalls")}
          subtitle={t("kpiTodaySubtitle")}
        />
        <KpiCard
          icon={MessageCircle}
          value={kpiByType.whatsapp_click?.today ?? 0}
          growthPercent={kpiByType.whatsapp_click?.growthPercent ?? null}
          label={t("kpiWhatsappClicks")}
          subtitle={t("kpiTodaySubtitle")}
        />
        <KpiCard
          icon={CalendarCheck}
          value={isHotel ? bookingsKpi?.total ?? 0 : "—"}
          growthPercent={isHotel ? bookingsKpi?.growthPercent ?? null : null}
          label={t("kpiBookings")}
          subtitle={isHotel ? t("kpiTotalSubtitle") : t("kpiHotelOnlySubtitle")}
        />
        <KpiCard icon={Star} value={listing.rating.toFixed(1)} growthPercent={null} label={t("kpiAverageRating")} subtitle={t("kpiReviewCountSubtitle", { count: listing.reviewCount })} />
      </div>

      <ViewsChart series={series} title={t("viewsChartTitle")} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{t("recentBookingsTitle")}</h2>
              <Link href={`/${locale}/business/bookings`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                {t("viewAll")} <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>
            {isHotel ? (
              bookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink/15 p-8 text-center dark:border-white/15">
                  <p className="text-sm font-medium text-ink/55 dark:text-sand/55">{t("noBookingsYet")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl2 border border-ink/8 bg-white p-3.5 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{b.guestName}</p>
                        <p className="text-xs text-ink/50 dark:text-sand/50">
                          {b.checkIn} → {b.checkOut}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-bold capitalize dark:bg-white/10">
                        {t(`bookingStatus_${b.status}`)}
                      </span>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="rounded-2xl border border-dashed border-ink/15 p-8 text-center dark:border-white/15">
                <p className="text-sm font-medium text-ink/55 dark:text-sand/55">{t("bookingsHotelOnly")}</p>
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{t("latestReviewsTitle")}</h2>
              <Link href={`/${locale}/business/reviews`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                {t("viewAll")} <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink/15 p-8 text-center dark:border-white/15">
                <p className="text-sm font-medium text-ink/55 dark:text-sand/55">{t("noReviewsYet")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 3).map((r) => (
                  <ReviewCard key={r.id} review={r} listingType={listing.listingType} listingId={listing.id} revalidatePath={redirectTo} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <PerformanceTips
            hasLogo={Boolean(listing.logo)}
            hasGalleryPhotos={listing.galleryCount > 0}
            hasPhone={Boolean(listing.phone)}
            hasDescription={listing.hasDescription}
            hasWebsite={Boolean(listing.website)}
            unrepliedReviewsCount={unrepliedReviewsCount}
          />
        </div>
      </div>
    </div>
  );
}
