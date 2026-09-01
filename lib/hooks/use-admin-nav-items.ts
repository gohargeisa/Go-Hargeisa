"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Inbox, LayoutGrid, Building2, Users, Star, Flag, BarChart3, Settings,
  Hotel, UtensilsCrossed, Coffee, Landmark, CalendarDays, Newspaper,
  CalendarCheck, Handshake, Megaphone, Tag, Bell, Stethoscope, ShoppingBag,
  ShieldCheck, Percent, Sparkles,
} from "lucide-react";
import type { SidebarNavItem } from "@/components/shared/sidebar-nav";
import type { Locale } from "@/lib/i18n/config";

/**
 * Single source of truth for the admin/"Owner Control Center" nav items —
 * shared by the desktop AdminSidebar (components/admin/admin-sidebar.tsx)
 * and the mobile hamburger menu (components/layout/site-header.tsx), so
 * mobile always lists exactly the same sections as desktop instead of a
 * second hand-maintained copy drifting out of sync. Every item renders
 * unconditionally regardless of role (owner vs business_owner) — matching
 * the desktop sidebar's existing behavior, where per-section access is
 * enforced by middleware.ts + each page's own guard, not by hiding the nav
 * entry itself.
 */
export function useAdminNavItems(locale: Locale): { primaryItems: SidebarNavItem[]; moreItems: SidebarNavItem[] } {
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
    { key: "cityServices", label: t("cityServicesNav"), icon: Building2, href: `/${locale}/admin/city-services`, isActive: isActive("/admin/city-services"), indent: true },
    { key: "articles", label: t("articlesNavShort"), icon: Newspaper, href: `/${locale}/admin/articles`, isActive: isActive("/admin/articles"), indent: true },
    { key: "users", label: t("usersNav"), icon: Users, href: `/${locale}/admin/users`, isActive: isActive("/admin/users") },
    { key: "teamAccess", label: t("teamAccessNav"), icon: ShieldCheck, href: `/${locale}/admin/team-access`, isActive: isActive("/admin/team-access") },
    { key: "reviews", label: t("reviewsNav"), icon: Star, href: `/${locale}/admin/reviews`, isActive: isActive("/admin/reviews") },
    { key: "reports", label: t("reportsNav"), icon: Flag, href: `/${locale}/admin/claims`, isActive: isActive("/admin/claims") },
    { key: "analytics", label: t("analyticsNav"), icon: BarChart3, href: `/${locale}/admin`, isActive: isActive("/admin", true) },
    { key: "settings", label: t("settingsNav"), icon: Settings, href: `/${locale}/admin/settings`, isActive: isActive("/admin/settings") },
    { key: "taxPolicy", label: t("taxPolicyNav"), icon: Percent, href: `/${locale}/admin/tax-policy`, isActive: isActive("/admin/tax-policy") },
  ];

  const moreItems: SidebarNavItem[] = [
    { key: "bookings", label: t("bookingsAdminTitle"), icon: CalendarCheck, href: `/${locale}/admin/bookings`, isActive: isActive("/admin/bookings") },
    { key: "appointments", label: t("appointmentsAdminTitle"), icon: Stethoscope, href: `/${locale}/admin/appointments`, isActive: isActive("/admin/appointments") },
    { key: "productOrders", label: t("productOrdersAdminTitle"), icon: ShoppingBag, href: `/${locale}/admin/product-orders`, isActive: isActive("/admin/product-orders") },
    { key: "loyalty", label: t("loyaltyNav"), icon: Sparkles, href: `/${locale}/admin/loyalty`, isActive: isActive("/admin/loyalty") },
    { key: "partners", label: t("partnersNav"), icon: Handshake, href: `/${locale}/admin/partners`, isActive: isActive("/admin/partners") },
    { key: "announcements", label: t("announcementsNav"), icon: Megaphone, href: `/${locale}/admin/announcements`, isActive: isActive("/admin/announcements") },
    { key: "offers", label: t("offersNav"), icon: Tag, href: `/${locale}/admin/offers`, isActive: isActive("/admin/offers") },
    { key: "notifications", label: t("notificationsNav"), icon: Bell, href: `/${locale}/admin/notifications`, isActive: isActive("/admin/notifications") },
  ];

  return { primaryItems, moreItems };
}
