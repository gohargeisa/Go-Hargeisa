"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, Compass, Heart, Bell, User } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { useSearchOverlay } from "@/components/shared/search-overlay-provider";

/**
 * Floating native-style bottom tab bar — Home / Explore / Saved /
 * Notifications / Profile. Hidden on hotel/restaurant/cafe detail routes,
 * where MobileBookingBar (components/shared/mobile-booking-bar.tsx) already
 * owns a fixed-bottom bar; showing both would stack two floating bars on
 * top of each other. Every other route (including attraction/event/
 * city-service detail pages, which have no fixed-bottom bar of their own)
 * keeps this visible.
 *
 * Saved/Notifications/Profile all point at /dashboard's own tab query
 * param (?tab=favorites|notifications|profile) rather than separate pages
 * — that's the real, existing destination for each (see
 * components/dashboard/dashboard-tabs.tsx); /dashboard already redirects
 * signed-out visitors to login via requireUser() (lib/supabase/guards.ts),
 * so no separate signed-out handling is needed here. Explore intentionally
 * does NOT link to the existing /explore route (that's a narrow
 * neighborhoods directory, not a discovery hub) — it opens the full-screen
 * search takeover instead, the same role Airbnb's own "Explore" tab plays.
 */
const HIDE_ON = /^\/[a-z]{2}\/(hotels|restaurants|cafes)\/.+/;

export function BottomNav({ locale }: { locale: Locale }) {
  const t = useTranslations("bottomNav");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { open: openSearch } = useSearchOverlay();

  if (HIDE_ON.test(pathname)) return null;

  const activeTab = searchParams.get("tab");
  const onDashboard = pathname === `/${locale}/dashboard`;
  const isHome = pathname === `/${locale}`;
  const isSaved = onDashboard && (activeTab === "favorites" || activeTab === null);
  const isNotifications = onDashboard && activeTab === "notifications";
  const isProfile = onDashboard && activeTab === "profile";

  // /dashboard already redirects signed-out visitors to
  // /auth/login?next=... server-side (requireUser() in lib/supabase/
  // guards.ts) — no need to build that redirect ourselves here.
  const dashboardHref = (tab: string) => `/${locale}/dashboard?tab=${tab}`;

  const items: {
    key: string;
    label: string;
    icon: typeof Home;
    href?: string;
    onClick?: () => void;
    active: boolean;
  }[] = [
    { key: "home", label: t("home"), icon: Home, href: `/${locale}`, active: isHome },
    { key: "explore", label: t("explore"), icon: Compass, onClick: openSearch, active: false },
    { key: "saved", label: t("saved"), icon: Heart, href: dashboardHref("favorites"), active: isSaved },
    { key: "notifications", label: t("notifications"), icon: Bell, href: dashboardHref("notifications"), active: isNotifications },
    { key: "profile", label: t("profile"), icon: User, href: dashboardHref("profile"), active: isProfile },
  ];

  return (
    <nav
      aria-label={t("navAriaLabel")}
      className="glass fixed inset-x-3 z-40 flex items-center justify-around rounded-[1.75rem] px-1 py-1.5 shadow-premium lg:hidden"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {items.map(({ key, label, icon: Icon, href, onClick, active }) => {
        const content = (
          <span
            className={`flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-2xl px-2 py-2 transition-colors duration-150 ${
              active ? "text-primary" : "text-ink/55 dark:text-sand/55"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
            <span className="text-[10.5px] font-semibold leading-none">{label}</span>
          </span>
        );

        if (href) {
          return (
            <Link key={key} href={href} aria-label={label} aria-current={active ? "page" : undefined} className="active:scale-90 transition-transform">
              {content}
            </Link>
          );
        }
        return (
          <button key={key} type="button" onClick={onClick} aria-label={label} className="active:scale-90 transition-transform">
            {content}
          </button>
        );
      })}
    </nav>
  );
}
