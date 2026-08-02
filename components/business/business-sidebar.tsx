"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import {
  Home,
  Building2,
  CalendarDays,
  Images,
  Star,
  BarChart3,
  MessageCircle,
  CreditCard,
  Settings,
  HelpCircle,
  Menu,
  X,
  ExternalLink,
  Tag,
  Bell,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { SignOutButton } from "@/components/shared/sign-out-button";
import type { OwnedListing } from "@/lib/data/business";

const NAV_ITEMS = [
  { href: "", icon: Home, key: "navDashboard" },
  { href: "/listing", icon: Building2, key: "navMyBusiness" },
  { href: "/offers", icon: Tag, key: "navOffers" },
  { href: "/bookings", icon: CalendarDays, key: "navBookings" },
  { href: "/gallery", icon: Images, key: "navGallery" },
  { href: "/reviews", icon: Star, key: "navReviews" },
  { href: "/analytics", icon: BarChart3, key: "navAnalytics" },
  { href: "/messages", icon: MessageCircle, key: "navMessages" },
  { href: "/notifications", icon: Bell, key: "navNotifications" },
  { href: "/subscription", icon: CreditCard, key: "navSubscription" },
  { href: "/settings", icon: Settings, key: "navSettings" },
  { href: "/support", icon: HelpCircle, key: "navSupport" },
] as const;

const PUBLIC_SEGMENT: Record<OwnedListing["listingType"], string> = {
  hotel: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  service: "services",
};

/**
 * Persistent desktop sidebar that becomes a slide-in drawer on mobile
 * (mirrors the AnimatePresence + backdrop pattern already used by
 * components/shared/bottom-sheet.tsx, just sliding from the side).
 */
export function BusinessSidebar({ locale, listing }: { locale: Locale; listing: OwnedListing }) {
  const t = useTranslations("businessDashboard");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  useFocusTrap(mobileNavRef, mobileOpen);
  const reduceMotion = useReducedMotion();
  const isRtl = locale === "ar";
  const base = `/${locale}/business`;

  function isActive(href: string) {
    const target = `${base}${href}`;
    return href === "" ? pathname === base : pathname.startsWith(target);
  }

  const typeLabel = { hotel: t("typeHotel"), restaurant: t("typeRestaurant"), cafe: t("typeCafe"), service: t("typeService") }[listing.listingType];
  const publicHref = `/${locale}/${PUBLIC_SEGMENT[listing.listingType]}/${listing.slug}`;

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {NAV_ITEMS.map(({ href, icon: Icon, key }) => (
        <Link
          key={key}
          href={`${base}${href}`}
          onClick={() => setMobileOpen(false)}
          aria-current={isActive(href) ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl2 px-3.5 py-2.5 text-sm font-semibold transition-colors ${
            isActive(href)
              ? "bg-primary text-white shadow-sm"
              : "text-ink/65 hover:bg-primary/5 hover:text-primary dark:text-sand/65 dark:hover:bg-white/5"
          }`}
        >
          <Icon size={18} aria-hidden="true" />
          {t(key)}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-ink/8 p-4 dark:border-white/10">
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-ink/10 bg-ink/5 dark:border-white/15 dark:bg-white/5">
          {listing.logo ? (
            <Image src={listing.logo} alt={listing.name} fill sizes="44px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 size={18} className="text-ink/30" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{listing.name}</p>
          <p className="text-xs text-ink/50 dark:text-sand/50">{typeLabel}</p>
        </div>
      </div>
      <Link
        href={publicHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-1.5 rounded-full border border-ink/15 py-2 text-xs font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
      >
        {t("viewPublicListing")}
        <ExternalLink size={12} aria-hidden="true" />
      </Link>
      <div className="mt-3">
        <SignOutButton
          locale={locale}
          className="flex w-full items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold text-ink/60 transition-colors hover:text-red-500 dark:text-sand/60"
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-ink/8 bg-white p-4 dark:border-white/10 dark:bg-ink lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label={t("openMenu")}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/10 dark:border-white/15"
        >
          <Menu size={19} aria-hidden="true" />
        </button>
        <p className="truncate text-sm font-bold">{listing.name}</p>
        <div className="h-10 w-10" aria-hidden="true" />
      </div>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-ink/8 bg-white dark:border-white/10 dark:bg-ink lg:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="font-display text-lg font-bold text-primary">Go Hargeisa</span>
          <span className="text-xs font-semibold text-ink/40 dark:text-sand/40">{t("businessBadge")}</span>
        </div>
        {nav}
        {footer}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <m.div
              initial={reduceMotion ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <m.div
              ref={mobileNavRef}
              role="dialog"
              aria-modal="true"
              aria-label={t("navAriaLabel")}
              tabIndex={-1}
              initial={reduceMotion ? undefined : { x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={reduceMotion ? undefined : { x: isRtl ? "100%" : "-100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 start-0 z-[70] flex w-[85vw] max-w-xs flex-col bg-white shadow-2xl dark:bg-ink lg:hidden"
            >
              <div className="flex items-center justify-between px-5 py-5">
                <span className="font-display text-lg font-bold text-primary">Go Hargeisa</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label={t("closeMenu")}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 dark:bg-white/10"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              {nav}
              {footer}
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
