"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Inbox, LayoutGrid, Building2, Users, Star, Flag, BarChart3, Settings,
  Hotel, UtensilsCrossed, Coffee, Landmark, CalendarDays, Stethoscope, Newspaper,
  CalendarCheck, Handshake, Megaphone, Tag, Bell,
} from "lucide-react";
import { SidebarNav, type SidebarNavItem } from "@/components/shared/sidebar-nav";
import type { Locale } from "@/lib/i18n/config";

/** Persistent admin nav — one place every /admin/* page is reachable from,
 * replacing the old per-page hero pill-link rows. "Businesses" groups every
 * per-vertical admin page (each still has its own dedicated table/route —
 * see the categories system's target_table design) instead of a single
 * merged list, since consolidating 6+ differently-shaped tables into one
 * CRUD view would be a much larger rebuild than a navigation reorganization. */
export function AdminSidebar({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const t = useTranslations("admin");

  function isActive(href: string, exact = false) {
    const full = `/${locale}${href}`;
    return exact ? pathname === full : pathname === full || pathname.startsWith(`${full}/`);
  }

  const primaryItems: SidebarNavItem[] = [
    { key: "requests", label: t("requestsNav"), icon: Inbox, href: `/${locale}/admin/requests`, isActive: isActive("/admin/requests") },
    { key: "categories", label: t("categoriesNav"), icon: LayoutGrid, href: `/${locale}/admin/categories`, isActive: isActive("/admin/categories") },
    { key: "businessesGroup", label: t("businessesNav"), icon: Building2, isGroupLabel: true, isActive: false },
    { key: "hotels", label: t("hotelsNavShort"), icon: Hotel, href: `/${locale}/admin/hotels`, isActive: isActive("/admin/hotels"), indent: true },
    { key: "restaurants", label: t("restaurantsNavShort"), icon: UtensilsCrossed, href: `/${locale}/admin/restaurants`, isActive: isActive("/admin/restaurants"), indent: true },
    { key: "cafes", label: t("cafesNavShort"), icon: Coffee, href: `/${locale}/admin/cafes`, isActive: isActive("/admin/cafes"), indent: true },
    { key: "attractions", label: t("attractionsNavShort"), icon: Landmark, href: `/${locale}/admin/attractions`, isActive: isActive("/admin/attractions"), indent: true },
    { key: "events", label: t("eventsNavShort"), icon: CalendarDays, href: `/${locale}/admin/events`, isActive: isActive("/admin/events"), indent: true },
    { key: "services", label: t("servicesNavShort"), icon: Stethoscope, href: `/${locale}/admin/services`, isActive: isActive("/admin/services"), indent: true },
    { key: "cityServices", label: t("cityServicesNav"), icon: Building2, href: `/${locale}/admin/city-services`, isActive: isActive("/admin/city-services"), indent: true },
    { key: "articles", label: t("articlesNavShort"), icon: Newspaper, href: `/${locale}/admin/articles`, isActive: isActive("/admin/articles"), indent: true },
    { key: "users", label: t("usersNav"), icon: Users, href: `/${locale}/admin/users`, isActive: isActive("/admin/users") },
    { key: "reviews", label: t("reviewsNav"), icon: Star, href: `/${locale}/admin/reviews`, isActive: isActive("/admin/reviews") },
    { key: "reports", label: t("reportsNav"), icon: Flag, href: `/${locale}/admin/claims`, isActive: isActive("/admin/claims") },
    { key: "analytics", label: t("analyticsNav"), icon: BarChart3, href: `/${locale}/admin`, isActive: isActive("/admin", true) },
    { key: "settings", label: t("settingsNav"), icon: Settings, href: `/${locale}/admin/settings`, isActive: isActive("/admin/settings") },
  ];

  const moreItems: SidebarNavItem[] = [
    { key: "bookings", label: t("bookingsAdminTitle"), icon: CalendarCheck, href: `/${locale}/admin/bookings`, isActive: isActive("/admin/bookings") },
    { key: "partners", label: t("partnersNav"), icon: Handshake, href: `/${locale}/admin/partners`, isActive: isActive("/admin/partners") },
    { key: "announcements", label: t("announcementsNav"), icon: Megaphone, href: `/${locale}/admin/announcements`, isActive: isActive("/admin/announcements") },
    { key: "offers", label: t("offersNav"), icon: Tag, href: `/${locale}/admin/offers`, isActive: isActive("/admin/offers") },
    { key: "notifications", label: t("notificationsNav"), icon: Bell, href: `/${locale}/admin/notifications`, isActive: isActive("/admin/notifications") },
  ];

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
      <SidebarNav items={primaryItems} ariaLabel={t("adminSectionsAriaLabel")} />
      <SidebarNav items={moreItems} ariaLabel={t("adminMoreSectionsAriaLabel")} />
    </div>
  );
}
