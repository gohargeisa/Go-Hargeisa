import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Hotel, UtensilsCrossed, Coffee, Landmark, CalendarDays, Newspaper,
  Users, BarChart3, Plus, ArrowRight, TrendingUp,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireOwner } from "@/lib/supabase/guards";
import { getHotels } from "@/lib/data/hotels";
import { getRestaurants } from "@/lib/data/restaurants";
import { getCafes } from "@/lib/data/cafes";
import { getAttractions } from "@/lib/data/attractions";
import { getEvents } from "@/lib/data/events";
import { getArticles } from "@/lib/data/articles";

export const metadata: Metadata = { title: "Owner Dashboard — Go Hargeisa" };

export default async function OwnerDashboardPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireOwner(locale, `/${locale}/admin`);
  const t = await getTranslations({ locale, namespace: "admin" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const [hotels, restaurants, cafes, attractions, events, articles] = await Promise.all([
    getHotels(),
    getRestaurants(),
    getCafes(),
    getAttractions(),
    getEvents(),
    getArticles(),
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

  return (
    <section className="container-px mx-auto py-8 md:py-12">
      {/* Header */}
      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">{t("dashboardTitle")}</h1>
          <p className="mt-2 text-sm text-ink/60 dark:text-sand/60">{t("dashboardSubtitle")}</p>
        </div>
        <Link
          href={`/${locale}/admin/users`}
          className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
        >
          <Users size={16} /> {t("usersNav")}
        </Link>
      </div>

      {/* Overview Card */}
      <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">{t("totalContent")}</p>
            <p className="mt-2 font-display text-4xl font-bold md:text-5xl">{totalListings}</p>
            <p className="mt-2 text-sm text-ink/60 dark:text-sand/60">{t("acrossAllCategories")}</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Content Stats Grid */}
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

      {/* Quick Actions */}
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

      {/* Recent Listings Preview (Coming Soon) */}
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
    </section>
  );
}
