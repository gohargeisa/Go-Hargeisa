"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { m, useReducedMotion } from "framer-motion";
import { Home, Compass, Heart, Bell, User } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { useSearchOverlay } from "@/components/shared/search-overlay-provider";
import { useOfflineFavoritesSheet } from "@/components/shared/offline-favorites-provider";
import { useMobileActionBarPresent } from "@/components/shared/mobile-action-bar-provider";
import { useNetworkStatus } from "@/lib/hooks/use-network-status";

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

/** In-flow clearance below the page so the floating BottomNav never strands
 * the last content underneath it. Mirrors BottomNav's own visibility: nothing
 * on detail routes that carry their own fixed bottom bar, and nothing while a
 * page-level MobileActionBar is mounted (that bar renders its own spacer). */
export function BottomNavSpacer() {
  const pathname = usePathname();
  const actionBarPresent = useMobileActionBarPresent();
  if (HIDE_ON.test(pathname) || actionBarPresent) return null;
  return <div aria-hidden="true" data-global-bottom-nav className="h-[calc(5.5rem+env(safe-area-inset-bottom))] lg:hidden" />;
}

export function BottomNav({ locale }: { locale: Locale }) {
  const t = useTranslations("bottomNav");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { open: openSearch } = useSearchOverlay();
  const { open: openOfflineFavorites } = useOfflineFavoritesSheet();
  const { isOnline } = useNetworkStatus();
  const reduceMotion = useReducedMotion();
  const actionBarPresent = useMobileActionBarPresent();

  // Hidden on detail routes that own a fixed bottom bar via the path regex,
  // and whenever a page-level MobileActionBar (MobileBookingBar on the
  // partner-storefront routes) is mounted — both live at the exact same
  // fixed position, so only one may ever render.
  if (HIDE_ON.test(pathname) || actionBarPresent) return null;

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
    // Offline: /dashboard is intentionally excluded from the service
    // worker's cache (shared-device privacy, see public/sw.js) and would
    // hard-fail — open the offline-reachable "Saved for offline" sheet
    // instead. Online behavior (a plain Link) is unchanged.
    isOnline
      ? { key: "saved", label: t("saved"), icon: Heart, href: dashboardHref("favorites"), active: isSaved }
      : { key: "saved", label: t("saved"), icon: Heart, onClick: openOfflineFavorites, active: false },
    { key: "notifications", label: t("notifications"), icon: Bell, href: dashboardHref("notifications"), active: isNotifications },
    { key: "profile", label: t("profile"), icon: User, href: dashboardHref("profile"), active: isProfile },
  ];

  return (
    <nav
      aria-label={t("navAriaLabel")}
      data-global-bottom-nav
      className="glass fixed inset-x-3 z-chrome flex items-center justify-around rounded-xl3 px-1 py-1.5 shadow-premium lg:hidden"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {items.map(({ key, label, icon: Icon, href, onClick, active }) => {
        const content = (
          <span className="relative flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-2xl px-2 py-2">
            {active && (
              <m.span
                initial={reduceMotion ? undefined : { opacity: 0, scale: 0.7 }}
                animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 rounded-2xl bg-primary/10 dark:bg-primary/20"
                aria-hidden="true"
              />
            )}
            <span
              className={`relative flex flex-col items-center gap-0.5 transition-colors duration-150 ${
                // /55 measured below the 4.5:1 contrast axe requires at this
                // 10.5px size (small text doesn't get the "large text" 3:1
                // relaxation even at font-semibold) — /70 matches the
                // opacity already used site-wide for secondary text.
                active ? "text-primary-700" : "text-ink/70 dark:text-sand/70"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
              <span className="text-[10.5px] font-semibold leading-none">{label}</span>
            </span>
          </span>
        );

        if (href) {
          return (
            <Link key={key} href={href} aria-label={label} aria-current={active ? "page" : undefined} className="active:scale-90 transition-transform ease-premium">
              {content}
            </Link>
          );
        }
        return (
          <button key={key} type="button" onClick={onClick} aria-label={label} className="active:scale-90 transition-transform ease-premium">
            {content}
          </button>
        );
      })}
    </nav>
  );
}
