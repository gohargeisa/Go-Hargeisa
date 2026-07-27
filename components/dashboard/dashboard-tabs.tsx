"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, Compass, Heart, MapIcon, MessageSquare, Settings as SettingsIcon, Sparkles, User } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { ListingCard } from "@/components/shared/listing-card";
import { HotelCard } from "@/components/shared/hotel-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SavedTripsPanel } from "@/components/dashboard/saved-trips-panel";
import { ReviewsPanel } from "@/components/dashboard/reviews-panel";
import { ProfilePanel } from "@/components/dashboard/profile-panel";
import { SettingsPanel } from "@/components/dashboard/settings-panel";
import type { SavedTrip } from "@/lib/data/saved-trips";
import type { MyReview } from "@/lib/data/reviews";

type FavoriteEntry = { kind: "hotel" | "restaurant" | "cafe" | "attraction"; item: { id: string; slug: string; name: string; address: string; coverImage: string; rating: number; reviewCount: number } };
const hrefKind: Record<FavoriteEntry["kind"], string> = { hotel: "hotels", restaurant: "restaurants", cafe: "cafes", attraction: "attractions" };
const tabs = [
  { key: "favorites", icon: Heart }, { key: "trips", icon: MapIcon },
  { key: "reviews", icon: MessageSquare }, { key: "profile", icon: User },
  { key: "settings", icon: SettingsIcon }, { key: "notifications", icon: Bell },
] as const;
type TabKey = (typeof tabs)[number]["key"];
const tabKeys: readonly string[] = tabs.map((tab) => tab.key);
function isTabKey(value: string | null): value is TabKey {
  return !!value && tabKeys.includes(value);
}

export function DashboardTabs({
  locale, userId, email, favorites, trips, reviews, userName, avatarUrl,
  phone, bio, hasPassword, memberSince, notifyActivity, notifyMarketing,
}: {
  locale: Locale; userId: string; email: string; favorites: FavoriteEntry[]; trips: SavedTrip[];
  reviews: MyReview[]; userName: string; avatarUrl: string;
  phone: string; bio: string; hasPassword: boolean; memberSince: string;
  notifyActivity: boolean; notifyMarketing: boolean;
}) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Lets the header's Profile/Settings dropdown links (?tab=profile) open
  // straight to that tab instead of always landing on Favorites.
  const [active, setActive] = useState<TabKey>(() => {
    const requested = searchParams.get("tab");
    return isTabKey(requested) ? requested : "favorites";
  });

  function selectTab(key: TabKey) {
    setActive(key);
    router.replace(key === "favorites" ? pathname : `${pathname}?tab=${key}`, { scroll: false });
  }
  const tabLabels: Record<TabKey, string> = {
    favorites: t("tabFavorites"),
    trips: t("tabTrips"),
    reviews: t("tabReviews"),
    profile: t("tabProfile"),
    settings: t("settings"),
    notifications: t("tabNotifications"),
  };
  const stats = [
    { label: t("statsSavedPlaces"), value: favorites.length, icon: Heart, tone: "text-rose-500 bg-rose-500/10" },
    { label: t("statsPlannedTrips"), value: trips.length, icon: MapIcon, tone: "text-primary bg-primary/10" },
    { label: t("statsLocalReviews"), value: reviews.length, icon: MessageSquare, tone: "text-secondary-700 bg-secondary/15" },
  ];

  return (
    <div className="mt-6 md:mt-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon size={17} /></div>
            <p className="mt-4 font-display text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-sm text-ink/55 dark:text-sand/60">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav className="flex gap-1.5 overflow-x-auto rounded-2xl border border-ink/8 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-white/[0.03] lg:flex-col lg:self-start" aria-label={t("sectionsAriaLabel")}>
          {tabs.map(({ key, icon: Icon }) => (
            <button key={key} type="button" onClick={() => selectTab(key)} aria-current={active === key ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-start text-sm font-semibold transition-all ${active === key ? "bg-primary text-white shadow-sm" : "text-ink/65 hover:bg-primary/5 hover:text-primary dark:text-sand/65 dark:hover:bg-white/5"}`}>
              <Icon size={17} /> {tabLabels[key]}
            </button>
          ))}
        </nav>

        <section className="min-h-[360px] rounded-2xl border border-ink/8 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] md:p-7">
          {active === "favorites" && <div>
            <div className="mb-6 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("favoritesEyebrow")}</p><h2 className="mt-1 font-display text-2xl font-semibold">{t("favoritesTitle")}</h2></div><Heart size={22} className="text-primary" /></div>
            {favorites.length === 0 ? <EmptyState icon={Compass} title={t("emptyFavoritesTitle")} description={t("emptyFavoritesDescription")} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{favorites.map(({ kind, item }) => kind === "hotel" ? <HotelCard key={item.id} href={`/${locale}/hotels/${item.slug}`} image={item.coverImage} name={item.name} address={item.address} rating={item.rating} reviewCount={item.reviewCount} hotelId={item.id} initiallyFavorited locale={locale} /> : <ListingCard key={item.id} href={`/${locale}/${hrefKind[kind]}/${item.slug}`} image={item.coverImage} title={item.name} subtitle={item.address} rating={item.rating} reviewCount={item.reviewCount} listingType={kind} listingId={item.id} initiallyFavorited locale={locale} />)}</div>}
          </div>}
          {active === "trips" && <SavedTripsPanel locale={locale} trips={trips} />}
          {active === "reviews" && <ReviewsPanel locale={locale} reviews={reviews} />}
          {active === "profile" && (
            <ProfilePanel
              locale={locale}
              userId={userId}
              email={email}
              initialName={userName}
              initialAvatar={avatarUrl}
              initialPhone={phone}
              initialBio={bio}
              hasPassword={hasPassword}
            />
          )}
          {active === "settings" && (
            <SettingsPanel
              locale={locale}
              email={email}
              memberSince={memberSince}
              hasPassword={hasPassword}
              initialNotifyActivity={notifyActivity}
              initialNotifyMarketing={notifyMarketing}
            />
          )}
          {active === "notifications" && <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("notificationsEyebrow")}</p><h2 className="mt-1 font-display text-2xl font-semibold">{t("notificationsTitle")}</h2><div className="mt-6"><EmptyState icon={Sparkles} title={t("emptyNotificationsTitle")} description={t("emptyNotificationsDescription")} /></div></div>}
        </section>
      </div>
    </div>
  );
}
