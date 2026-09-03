"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, m } from "framer-motion";
import {
  Bell, BedDouble, Building2, Compass, Heart, LayoutDashboard, MapIcon,
  MessageSquare, Settings as SettingsIcon, ShieldCheck, LifeBuoy, Star, Stethoscope, User, PackageSearch, ShoppingBag,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { syncFavorites } from "@/lib/offline/favorites-store";
import { ListingCard } from "@/components/shared/listing-card";
import { HotelCard } from "@/components/shared/hotel-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SidebarNav, SidebarShell, type SidebarNavItem } from "@/components/shared/sidebar-nav";
import { OverviewPanel, type OverviewStat } from "@/components/dashboard/overview-panel";
import { MyBusinessesPanel } from "@/components/dashboard/my-businesses-panel";
import { MessagesPanel } from "@/components/dashboard/messages-panel";
import { SavedTripsPanel } from "@/components/dashboard/saved-trips-panel";
import { ReviewsPanel } from "@/components/dashboard/reviews-panel";
import { BookingsPanel } from "@/components/dashboard/bookings-panel";
import { AppointmentsPanel } from "@/components/dashboard/appointments-panel";
import { MyRequestsPanel } from "@/components/dashboard/my-requests-panel";
import { MyOrdersPanel } from "@/components/dashboard/my-orders-panel";
import { ProfilePanel } from "@/components/dashboard/profile-panel";
import { SettingsPanel } from "@/components/dashboard/settings-panel";
import { SecurityPanel } from "@/components/dashboard/security-panel";
import { NotificationList } from "@/components/shared/notification-list";
import type { SavedTrip } from "@/lib/data/saved-trips";
import type { MyReview } from "@/lib/data/reviews";
import type { OwnedListing, OwnedListingMessage, MyAppointment } from "@/lib/data/business";
import { serviceHref } from "@/lib/utils/service-categories";
import type { Booking, Notification, PurchaseRequest, EventRequest } from "@/types";
import type { CustomerProductOrder } from "@/lib/data/product-orders";
import type { CustomerTableReservation } from "@/lib/data/reservations";

export type FavoriteEntry = { kind: "hotel" | "restaurant" | "cafe" | "attraction" | "service"; item: { id: string; slug: string; name: string; address: string; coverImage: string; rating: number; reviewCount: number; categorySlug?: string } };
const hrefKind: Partial<Record<FavoriteEntry["kind"], string>> = { hotel: "hotels", restaurant: "restaurants", cafe: "cafes", attraction: "attractions" };
/** Exported for reuse by components/shared/offline-favorites-sheet.tsx, which
 * links to the same listing pages from an IndexedDB-backed (not RSC-prop-
 * backed) favorites list — hence the narrower structural parameter type
 * instead of the full FavoriteEntry["item"] shape. */
export function favoriteHref(locale: Locale, kind: FavoriteEntry["kind"], item: { slug: string; categorySlug?: string }): string {
  if (kind === "service") return `/${locale}${serviceHref(item.categorySlug ?? "", item.slug)}`;
  return `/${locale}/${hrefKind[kind]}/${item.slug}`;
}

const tabs = [
  { key: "overview", icon: LayoutDashboard },
  { key: "myBusinesses", icon: Building2 },
  { key: "favorites", icon: Heart },
  { key: "trips", icon: MapIcon },
  { key: "bookings", icon: BedDouble },
  { key: "appointments", icon: Stethoscope },
  { key: "orders", icon: ShoppingBag },
  { key: "requests", icon: PackageSearch },
  { key: "reviews", icon: Star },
  { key: "messages", icon: MessageSquare },
  { key: "notifications", icon: Bell },
  { key: "profile", icon: User },
  { key: "settings", icon: SettingsIcon },
  { key: "security", icon: ShieldCheck },
  { key: "support", icon: LifeBuoy },
] as const;
type TabKey = (typeof tabs)[number]["key"];
const tabKeys: readonly string[] = tabs.map((tab) => tab.key);
function isTabKey(value: string | null): value is TabKey {
  return !!value && tabKeys.includes(value);
}

export function DashboardTabs({
  locale, userId, email, favorites, trips, bookings, appointments, reviews, notifications, unreadNotifications, userName, avatarUrl,
  phone, bio, hasPassword, memberSince, notifyActivity, notifyMarketing, notifyInApp, notifyCategories,
  ownedListings, messages, unreadMessages, purchaseRequests, eventRequests, productOrders, tableReservations, supportSlot,
}: {
  locale: Locale; userId: string; email: string; favorites: FavoriteEntry[]; trips: SavedTrip[];
  bookings: Booking[]; appointments: MyAppointment[]; reviews: MyReview[]; notifications: Notification[]; unreadNotifications: number;
  userName: string; avatarUrl: string;
  phone: string; bio: string; hasPassword: boolean; memberSince: string;
  notifyActivity: boolean; notifyMarketing: boolean; notifyInApp: boolean; notifyCategories: Record<string, boolean>;
  ownedListings: OwnedListing[]; messages: OwnedListingMessage[]; unreadMessages: number;
  purchaseRequests: PurchaseRequest[]; eventRequests: EventRequest[];
  productOrders: CustomerProductOrder[]; tableReservations: CustomerTableReservation[];
  /** SupportCard is a Server Component (reads next-intl/server + owner
   * profile) — rendered once in the server page and passed down here rather
   * than reimplemented as a client-safe duplicate. */
  supportSlot: React.ReactNode;
}) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Lets the header's Dashboard link (?tab=X) open straight to that tab
  // instead of always landing on Overview.
  const [active, setActive] = useState<TabKey>(() => {
    const requested = searchParams.get("tab");
    return isTabKey(requested) ? requested : "overview";
  });

  // Every /dashboard render (auth-gated, so only ever while online) is the
  // one place favorites data reaches the client — mirror it into IndexedDB
  // here so the offline favorites sheet (components/shared/offline-
  // favorites-sheet.tsx) has something to read when /dashboard itself is
  // unreachable offline (that route is intentionally excluded from the
  // service worker's cache — see public/sw.js).
  useEffect(() => {
    syncFavorites(favorites, locale);
  }, [favorites, locale]);

  function selectTab(key: TabKey) {
    setActive(key);
    router.replace(key === "overview" ? pathname : `${pathname}?tab=${key}`, { scroll: false });
  }
  const tabLabels: Record<TabKey, string> = {
    overview: t("navOverview"),
    myBusinesses: t("navMyBusinesses"),
    favorites: t("tabFavorites"),
    trips: t("tabTrips"),
    bookings: t("tabBookings"),
    appointments: t("tabAppointments"),
    orders: t("tabOrders"),
    requests: t("tabRequests"),
    reviews: t("tabReviews"),
    messages: t("navMessages"),
    profile: t("tabProfile"),
    settings: t("accountSettingsTitle"),
    security: t("securityTitle"),
    notifications: t("tabNotifications"),
    support: t("navSupport"),
  };
  const badges: Partial<Record<TabKey, number>> = {
    notifications: unreadNotifications,
    messages: unreadMessages,
  };

  const navItems: SidebarNavItem[] = tabs.map(({ key, icon }) => ({
    key,
    label: tabLabels[key],
    icon,
    isActive: active === key,
    badge: badges[key],
    onClick: () => selectTab(key),
  }));

  const overviewStats: OverviewStat[] = [
    { key: "favorites", label: t("statsSavedPlaces"), value: favorites.length, icon: Heart, tone: "text-rose-500 bg-rose-500/10", onClick: () => selectTab("favorites") },
    { key: "trips", label: t("statsPlannedTrips"), value: trips.length, icon: MapIcon, tone: "text-primary bg-primary/10", onClick: () => selectTab("trips") },
    { key: "bookings", label: t("tabBookings"), value: bookings.length, icon: BedDouble, tone: "text-accent-700 bg-accent/10", onClick: () => selectTab("bookings") },
    { key: "orders", label: t("tabOrders"), value: productOrders.length + tableReservations.length, icon: ShoppingBag, tone: "text-primary bg-primary/10", onClick: () => selectTab("orders") },
    { key: "reviews", label: t("statsLocalReviews"), value: reviews.length, icon: Star, tone: "text-secondary-700 bg-secondary/15", onClick: () => selectTab("reviews") },
  ];

  return (
    <div className="mt-6 md:mt-8">
      <SidebarShell nav={<SidebarNav items={navItems} ariaLabel={t("sectionsAriaLabel")} />}>
        <AnimatePresence mode="wait">
        <m.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
          {active === "overview" && <OverviewPanel userName={userName} stats={overviewStats} onNavigate={(key) => selectTab(key as TabKey)} />}
          {active === "myBusinesses" && <MyBusinessesPanel locale={locale} listings={ownedListings} />}
          {active === "favorites" && <div>
            <div className="mb-6 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">{t("favoritesEyebrow")}</p><h2 className="mt-1 font-display text-2xl font-semibold">{t("favoritesTitle")}</h2></div><Heart size={22} className="text-primary" /></div>
            {favorites.length === 0 ? <EmptyState icon={Compass} title={t("emptyFavoritesTitle")} description={t("emptyFavoritesDescription")} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{favorites.map(({ kind, item }) => kind === "hotel" ? <HotelCard key={item.id} href={`/${locale}/hotels/${item.slug}`} image={item.coverImage} name={item.name} address={item.address} rating={item.rating} reviewCount={item.reviewCount} hotelId={item.id} initiallyFavorited locale={locale} /> : <ListingCard key={item.id} href={favoriteHref(locale, kind, item)} image={item.coverImage} title={item.name} subtitle={item.address} rating={item.rating} reviewCount={item.reviewCount} listingType={kind} listingId={item.id} initiallyFavorited locale={locale} />)}</div>}
          </div>}
          {active === "trips" && <SavedTripsPanel locale={locale} trips={trips} />}
          {active === "bookings" && <BookingsPanel locale={locale} bookings={bookings} />}
          {active === "appointments" && <AppointmentsPanel locale={locale} appointments={appointments} />}
          {active === "orders" && <MyOrdersPanel locale={locale} orders={productOrders} reservations={tableReservations} />}
          {active === "requests" && <MyRequestsPanel locale={locale} purchaseRequests={purchaseRequests} eventRequests={eventRequests} />}
          {active === "reviews" && <ReviewsPanel locale={locale} reviews={reviews} />}
          {active === "messages" && <MessagesPanel locale={locale} messages={messages} hasBusinesses={ownedListings.length > 0} />}
          {active === "profile" && (
            <ProfilePanel
              locale={locale}
              userId={userId}
              email={email}
              initialName={userName}
              initialAvatar={avatarUrl}
              initialPhone={phone}
              initialBio={bio}
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
              initialNotifyInApp={notifyInApp}
              initialNotifyCategories={notifyCategories}
            />
          )}
          {active === "security" && <SecurityPanel locale={locale} hasPassword={hasPassword} />}
          {active === "notifications" && <div>
            <div className="mb-6 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">{t("notificationsEyebrow")}</p><h2 className="mt-1 font-display text-2xl font-semibold">{t("notificationsTitle")}</h2></div><Bell size={22} className="text-primary" /></div>
            <NotificationList locale={locale} initialItems={notifications} initialUnread={unreadNotifications} />
          </div>}
          {active === "support" && supportSlot}
        </m.div>
        </AnimatePresence>
      </SidebarShell>
    </div>
  );
}
