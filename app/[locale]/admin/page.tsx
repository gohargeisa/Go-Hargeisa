import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Hotel, UtensilsCrossed, Coffee, Landmark, CalendarDays, Newspaper,
  Users, BarChart3, Plus, ArrowRight, TrendingUp, Handshake, Building,
  Eye, MousePointerClick, CalendarCheck, Inbox, Megaphone, Tag,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireOwner } from "@/lib/supabase/guards";
import { getHotels } from "@/lib/data/hotels";
import { getRestaurants } from "@/lib/data/restaurants";
import { getCafes } from "@/lib/data/cafes";
import { getAttractions } from "@/lib/data/attractions";
import { getEvents } from "@/lib/data/events";
import { getArticles } from "@/lib/data/articles";
import {
  getOwnerPartnerOverview, getCityCoverage, getMissionChecklist, getOwnerViewsSeries, getOwnerKpis,
} from "@/lib/data/owner-dashboard";
import { getActivityLogs } from "@/lib/actions/activity";
import { getUserNotifications, getUnreadNotificationCount } from "@/lib/actions/notifications";
import { Reveal } from "@/components/home/reveal";
import { KpiCard } from "@/components/business/kpi-card";
import { ViewsChart } from "@/components/business/views-chart";
import { GlassStatCard } from "@/components/admin/control-center/glass-stat-card";
import { NotificationsBell } from "@/components/admin/control-center/notifications-bell";
import { MissionProgress } from "@/components/admin/control-center/mission-progress";
import { CityCoverageProgress } from "@/components/admin/control-center/city-coverage-progress";
import { TrialPartnersCard } from "@/components/admin/control-center/trial-partners-card";
import { SubscriptionBreakdown } from "@/components/admin/control-center/subscription-breakdown";
import { PartnerHealthMonitor } from "@/components/admin/control-center/partner-health-monitor";
import { ActivityTimeline } from "@/components/admin/control-center/activity-timeline";

export const metadata: Metadata = { title: "Owner Control Center — Go Hargeisa" };

export default async function OwnerDashboardPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireOwner(locale, `/${locale}/admin`);
  const t = await getTranslations({ locale, namespace: "admin" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const [
    hotels, restaurants, cafes, attractions, events, articles,
    partnerOverview, cityCoverage, missionChecklist, ownerViewsSeries, ownerKpis,
    activityLogs, notifications, unreadCount,
  ] = await Promise.all([
    getHotels(),
    getRestaurants(),
    getCafes(),
    getAttractions(),
    getEvents(),
    getArticles(),
    getOwnerPartnerOverview(),
    getCityCoverage(),
    getMissionChecklist(),
    getOwnerViewsSeries(),
    getOwnerKpis(),
    getActivityLogs(10),
    getUserNotifications(10),
    getUnreadNotificationCount(),
  ]);

  const contentStats = [
    { label: tNav("hotels"), value: hotels.length, icon: Hotel, href: "hotels", tone: "from-blue-500/10 to-blue-500/5" },
    { label: tNav("restaurants"), value: restaurants.length, icon: UtensilsCrossed, href: "restaurants", tone: "from-orange-500/10 to-orange-500/5" },
    { label: tNav("cafes"), value: cafes.length, icon: Coffee, href: "cafes", tone: "from-amber-500/10 to-amber-500/5" },
    { label: t("manageAttractions"), value: attractions.length, icon: Landmark, href: "attractions", tone: "from-purple-500/10 to-purple-500/5" },
    { label: tNav("events"), value: events.length, icon: CalendarDays, href: "events", tone: "from-red-500/10 to-red-500/5" },
    { label: t("manageArticles"), value: articles.length, icon: Newspaper, href: "articles", tone: "from-green-500/10 to-green-500/5" },
  ];

  const totalListings = hotels.length + restaurants.length + cafes.length + attractions.length + events.length + articles.length;

  const quickActions = [
    { label: t("newHotel"), href: "hotels/new", icon: Hotel },
    { label: t("newRestaurant"), href: "restaurants/new", icon: UtensilsCrossed },
    { label: t("newCafe"), href: "cafes/new", icon: Coffee },
    { label: t("newAttraction"), href: "attractions/new", icon: Landmark },
    { label: t("newEvent"), href: "events/new", icon: CalendarDays },
    { label: t("newArticle"), href: "articles/new", icon: Newspaper },
  ];

  const trialPartners = partnerOverview.partners.filter((p) => p.partnerStatus === "trial");

  return (
    <div>
      {/* ============ Glassmorphism hero ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-700 to-secondary-900 pb-10 pt-8 sm:pb-14 sm:pt-10">
        <div
          className="pointer-events-none absolute -top-24 -end-24 h-96 w-96 rounded-full bg-primary/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -start-16 h-80 w-80 rounded-full bg-accent/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="container-px relative mx-auto">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
                Owner Control Center
              </span>
              <h1 className="mt-3 font-display text-3xl font-bold text-white md:text-4xl">{t("dashboardTitle")}</h1>
              <p className="mt-2 text-sm text-white/70">{t("dashboardSubtitle")}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <NotificationsBell initialItems={notifications as never} initialUnread={unreadCount} />
              <Link
                href={`/${locale}/admin/requests`}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition-colors hover:bg-white/20"
              >
                <Inbox size={16} /> {t("requestsNav")}
              </Link>
              <Link
                href={`/${locale}/admin/offers`}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition-colors hover:bg-white/20"
              >
                <Tag size={16} /> {t("offersNav")}
              </Link>
              <Link
                href={`/${locale}/admin/partners`}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition-colors hover:bg-white/20"
              >
                <Handshake size={16} /> {t("partnersNav")}
              </Link>
              <Link
                href={`/${locale}/admin/city-services`}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition-colors hover:bg-white/20"
              >
                <Building size={16} /> {t("cityServicesNav")}
              </Link>
              <Link
                href={`/${locale}/admin/users`}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition-colors hover:bg-white/20"
              >
                <Users size={16} /> {t("usersNav")}
              </Link>
              <Link
                href={`/${locale}/admin/announcements`}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition-colors hover:bg-white/20"
              >
                <Megaphone size={16} /> {t("announcementsNav")}
              </Link>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <GlassStatCard icon={TrendingUp} value={totalListings} label={t("totalContent")} sublabel={t("acrossAllCategories")} />
            <GlassStatCard
              icon={Handshake}
              value={partnerOverview.officialCount}
              label="Official Partners"
              sublabel="Full dashboard access"
              tone="bg-violet-400/25 text-violet-50"
            />
            <GlassStatCard
              icon={Users}
              value={partnerOverview.trialCount}
              label="Trial Partners"
              sublabel="Visible, no dashboard yet"
              tone="bg-violet-400/25 text-violet-50"
            />
            <GlassStatCard
              icon={Building}
              value={`${cityCoverage.totalPublished}/${cityCoverage.totalTarget}`}
              label="City Coverage"
              sublabel={`${Math.round((cityCoverage.totalPublished / cityCoverage.totalTarget) * 100)}% of target filled`}
              progressPercent={(cityCoverage.totalPublished / cityCoverage.totalTarget) * 100}
            />
            <GlassStatCard
              icon={Eye}
              value={ownerKpis.totalViews.toLocaleString()}
              label="Total Views"
              sublabel="All-time, platform-wide"
              tone="bg-sky-400/25 text-sky-50"
            />
          </div>
        </div>
      </section>

      <section className="container-px mx-auto py-8 md:py-12">
        {/* ============ Premium Analytics ============ */}
        <Reveal>
          <div className="mb-10">
            <h2 className="font-display text-xl font-semibold">Premium Analytics</h2>
            <p className="mt-1 text-sm text-ink/55 dark:text-sand/55">Platform-wide traffic and activity, across every partner listing.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <KpiCard icon={Eye} value={ownerKpis.totalViews.toLocaleString()} growthPercent={null} label="Total Views" subtitle="Across every partner" tone="bg-sky-500/10 text-sky-600 dark:text-sky-400" />
              <KpiCard icon={MousePointerClick} value={ownerKpis.totalClicks.toLocaleString()} growthPercent={null} label="Total Clicks" subtitle="Website, call & WhatsApp" tone="bg-orange-500/10 text-orange-600 dark:text-orange-400" />
              <KpiCard icon={CalendarCheck} value={ownerKpis.totalBookings.toLocaleString()} growthPercent={null} label="Total Bookings" subtitle="All hotels, all time" tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <KpiCard icon={Eye} value={ownerKpis.todayViews.toLocaleString()} growthPercent={null} label="Today's Views" subtitle="Since midnight" tone="bg-sky-500/10 text-sky-600 dark:text-sky-400" />
              <KpiCard icon={Eye} value={ownerKpis.weekViews.toLocaleString()} growthPercent={null} label="This Week's Views" subtitle="Last 7 days" tone="bg-sky-500/10 text-sky-600 dark:text-sky-400" />
              <KpiCard icon={Eye} value={ownerKpis.monthViews.toLocaleString()} growthPercent={null} label="This Month's Views" subtitle="Since the 1st" tone="bg-sky-500/10 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="mt-4">
              <ViewsChart series={ownerViewsSeries} title="Platform Views" />
            </div>
          </div>
        </Reveal>

        {/* ============ Mission / Coverage / Partners / Subscriptions / Health / Activity ============ */}
        <Reveal delay={0.05}>
          <div className="mb-10 grid gap-4 lg:grid-cols-2">
            <MissionProgress items={missionChecklist} />
            <CityCoverageProgress
              categories={cityCoverage.categories}
              totalPublished={cityCoverage.totalPublished}
              totalTarget={cityCoverage.totalTarget}
            />
            <TrialPartnersCard locale={locale} trialPartners={trialPartners} />
            <SubscriptionBreakdown planCounts={partnerOverview.planCounts} />
            <PartnerHealthMonitor locale={locale} rows={partnerOverview.needsAttention} />
            <ActivityTimeline logs={activityLogs as never} />
          </div>
        </Reveal>

        {/* Content Stats Grid */}
        <Reveal delay={0.1}>
        <div className="mb-10">
          <h2 className="mb-4 font-display text-xl font-semibold">{t("contentOverview")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contentStats.map(({ label, value, icon: Icon, href, tone }) => (
              <Link
                key={label}
                href={`/${locale}/admin/${href}`}
                className="group rounded-xl border border-ink/8 dark:border-white/10 bg-gradient-to-br p-5 hover:border-primary/40 hover:shadow-md transition-all dark:hover:bg-white/[0.05]"
                style={{
                  backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                  backgroundPosition: '100% 0%'
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-sand/50">{label}</p>
                    <p className="mt-2 font-display text-2xl font-bold">{value}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${tone} text-current group-hover:shadow-lg transition-all`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  {t("viewAll")} <ArrowRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </div>
        </Reveal>

        {/* Quick Actions */}
        <Reveal delay={0.15}>
        <div className="mb-10">
          <h2 className="mb-4 font-display text-xl font-semibold">{t("quickActions")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={`/${locale}/admin/${href}`}
                className="flex items-center gap-3 rounded-lg border border-ink/12 dark:border-white/15 bg-white dark:bg-white/[0.03] px-4 py-3 hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-white/[0.08] transition-all"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon size={16} />
                </div>
                <span className="text-sm font-medium">{label}</span>
                <Plus size={14} className="ms-auto opacity-60" />
              </Link>
            ))}
          </div>
        </div>
        </Reveal>

        {/* Recent Listings Preview */}
        <Reveal delay={0.2}>
        <div className="rounded-2xl border border-ink/8 dark:border-white/10 p-6">
          <h2 className="font-display text-xl font-semibold">{t("recentListings")}</h2>
          <p className="mt-2 text-sm text-ink/60 dark:text-sand/60">{t("recentListingsSubtitle")}</p>

          <div className="mt-6 space-y-3">
            {hotels.length === 0 && restaurants.length === 0 && cafes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-ink/20 dark:border-white/20 p-8 text-center">
                <BarChart3 size={24} className="mx-auto text-ink/30 dark:text-white/30" />
                <p className="mt-3 font-medium text-ink/60 dark:text-white/60">{t("noListingsYet")}</p>
                <p className="text-xs text-ink/40 dark:text-white/40">{t("createFirstListing")}</p>
              </div>
            ) : (
              <>
                {hotels.slice(0, 2).map((hotel) => (
                  <Link
                    key={hotel.id}
                    href={`/${locale}/admin/hotels/${hotel.id}/edit`}
                    className="flex items-center justify-between rounded-lg border border-ink/8 dark:border-white/10 p-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Hotel size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{hotel.name}</p>
                        <p className="text-xs text-ink/50 dark:text-white/50">{t("hotelLabel")}</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-ink/30 dark:text-white/30" />
                  </Link>
                ))}
                {restaurants.slice(0, 2).map((restaurant) => (
                  <Link
                    key={restaurant.id}
                    href={`/${locale}/admin/restaurants/${restaurant.id}/edit`}
                    className="flex items-center justify-between rounded-lg border border-ink/8 dark:border-white/10 p-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <UtensilsCrossed size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{restaurant.name}</p>
                        <p className="text-xs text-ink/50 dark:text-white/50">{t("restaurantLabel")}</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-ink/30 dark:text-white/30" />
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
        </Reveal>
      </section>
    </div>
  );
}
