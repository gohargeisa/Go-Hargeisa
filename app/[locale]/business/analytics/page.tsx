import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Eye, Globe, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing, getKpiStats, getViewsSeries, getBusinessSummary, type AnalyticsRange } from "@/lib/data/business";
import { ViewsChart } from "@/components/business/views-chart";
import { KpiCard } from "@/components/business/kpi-card";
import { BusinessSummary } from "@/components/business/business-summary";

export const metadata: Metadata = { title: "Analytics — Dashboard", robots: { index: false } };

const RANGES: AnalyticsRange[] = ["7d", "30d", "90d", "12m"];

export default async function AnalyticsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/analytics`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;

  const t = await getTranslations({ locale, namespace: "businessDashboard" });

  const [kpiStats, seriesEntries, summary] = await Promise.all([
    getKpiStats(listing.listingType, listing.id),
    Promise.all(RANGES.map(async (r) => [r, await getViewsSeries(listing.listingType, listing.id, r)] as const)),
    getBusinessSummary(listing),
  ]);
  const series = Object.fromEntries(seriesEntries) as Record<AnalyticsRange, Awaited<ReturnType<typeof getViewsSeries>>>;
  const kpiByType = Object.fromEntries(kpiStats.map((k) => [k.eventType, k]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("navAnalytics")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("analyticsSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Eye} value={kpiByType.view?.today ?? 0} growthPercent={kpiByType.view?.growthPercent ?? null} label={t("kpiProfileViews")} subtitle={t("kpiTodaySubtitle")} />
        <KpiCard icon={Globe} value={kpiByType.website_click?.today ?? 0} growthPercent={kpiByType.website_click?.growthPercent ?? null} label={t("kpiWebsiteClicks")} subtitle={t("kpiTodaySubtitle")} />
        <KpiCard icon={Phone} value={kpiByType.call_click?.today ?? 0} growthPercent={kpiByType.call_click?.growthPercent ?? null} label={t("kpiPhoneCalls")} subtitle={t("kpiTodaySubtitle")} />
        <KpiCard icon={WhatsAppIcon} value={kpiByType.whatsapp_click?.today ?? 0} growthPercent={kpiByType.whatsapp_click?.growthPercent ?? null} label={t("kpiWhatsappClicks")} subtitle={t("kpiTodaySubtitle")} />
      </div>

      <ViewsChart series={series} title={t("viewsChartTitle")} />

      <BusinessSummary
        totalViews={summary.totalViews}
        totalBookings={summary.totalBookings}
        totalReviews={summary.totalReviews}
        memberSince={summary.memberSince}
      />
    </div>
  );
}
