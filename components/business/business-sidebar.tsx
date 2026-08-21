"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import {
  Home,
  Building2,
  CalendarDays,
  CalendarClock,
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
  Package,
  Users,
  Stethoscope,
  UserCog,
  CalendarCheck,
  ShoppingBag,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { SignOutButton } from "@/components/shared/sign-out-button";
import type { OwnedListing } from "@/lib/data/business";
import { isMedicalAppointmentCategory } from "@/lib/utils/appointment-domain";
import type { BusinessPermissionKey } from "@/types";

const BASE_NAV_ITEMS = [
  { href: "", icon: Home, key: "navDashboard" },
  { href: "/listing", icon: Building2, key: "navMyBusiness" },
  { href: "/offers", icon: Tag, key: "navOffers" },
  { href: "/gallery", icon: Images, key: "navGallery" },
  { href: "/reviews", icon: Star, key: "navReviews" },
  { href: "/analytics", icon: BarChart3, key: "navAnalytics" },
  { href: "/messages", icon: MessageCircle, key: "navMessages" },
  { href: "/notifications", icon: Bell, key: "navNotifications" },
  { href: "/subscription", icon: CreditCard, key: "navSubscription" },
  { href: "/settings", icon: Settings, key: "navSettings" },
  { href: "/support", icon: HelpCircle, key: "navSupport" },
] as const;

/** Room bookings only apply to hotels; table reservations only apply to
 * restaurants/cafes — previously both were unconditionally in
 * BASE_NAV_ITEMS, so e.g. a flower shop or clinic owner saw "Bookings" and
 * "Reservations" tabs that could never apply to them. Gated the same way
 * PRODUCTS_NAV_ITEM/appointmentsNavItems already are below. */
const BOOKINGS_NAV_ITEM = { href: "/bookings", icon: CalendarDays, key: "navBookings" } as const;
const RESERVATIONS_NAV_ITEM = { href: "/reservations", icon: CalendarClock, key: "navReservations" } as const;

/** Phase 4 — inserted right after "My Business" only for the listing types
 * that actually have these engines wired up (categories.supports_products/
 * supports_appointments), so every hotel/restaurant/cafe/service owner's
 * sidebar is completely unaffected. */
const PRODUCTS_NAV_ITEM = { href: "/products", icon: Package, key: "navProducts" } as const;
/** Product orders/requests (Flower Shops, Perfume Shops, ...) — same
 * supports_products gate as PRODUCTS_NAV_ITEM, since a listing can only
 * receive orders once it has a real product catalog. */
const ORDERS_NAV_ITEM = { href: "/orders", icon: ShoppingBag, key: "navOrders" } as const;

/** Which business_access_grants permission unlocks each nav item, for a
 * Team Member (listing.accessKind === "granted") — items with no entry
 * here are visible to any team member with an active grant on the
 * business, regardless of which specific permissions they hold. This
 * mapping is a judgment call (the approved permission set has no 1:1 key
 * per nav item, e.g. no separate "products" key): "edit" is required for
 * anything that changes the business's own public-facing data or billing
 * (listing, offers, gallery, products, subscription, settings), "view"
 * covers read-only pages, and a handful of low-sensitivity personal pages
 * (dashboard home, notifications, support) always show. */
const NAV_PERMISSION: Partial<Record<string, BusinessPermissionKey>> = {
  navMyBusiness: "businesses_edit",
  navOffers: "businesses_edit",
  navGallery: "businesses_edit",
  navReviews: "reviews_view",
  navAnalytics: "businesses_view",
  navMessages: "businesses_view",
  navSubscription: "businesses_edit",
  navSettings: "businesses_edit",
  navBookings: "bookings_view",
  navReservations: "bookings_view",
  navOrders: "orders_view",
  navProducts: "businesses_edit",
  navDepartments: "appointments_view",
  navDoctors: "appointments_view",
  staffLabel: "appointments_view",
  navAppointments: "appointments_view",
};

function getNavItems(listing: OwnedListing) {
  const items: { href: string; icon: typeof Home; key: string }[] = [...BASE_NAV_ITEMS];
  const myBusinessIndex = items.findIndex((i) => i.key === "navMyBusiness");
  // "Doctors" reads as Stethoscope/"Doctors" for Hospital/Clinic, and as a
  // generic staff icon/label for every other appointments-enabled category
  // (e.g. Beauty Salon) — see lib/utils/appointment-domain.ts. Same routes,
  // same underlying doctors/appointments tables either way.
  const isMedical = isMedicalAppointmentCategory(listing.categorySlug);
  const appointmentsNavItems = [
    { href: "/departments", icon: Users, key: "navDepartments" },
    { href: "/doctors", icon: isMedical ? Stethoscope : UserCog, key: isMedical ? "navDoctors" : "staffLabel" },
    { href: "/appointments", icon: CalendarCheck, key: "navAppointments" },
  ];
  const afterMyBusiness = [
    ...(listing.supportsProducts ? [PRODUCTS_NAV_ITEM, ORDERS_NAV_ITEM] : []),
    ...(listing.supportsAppointments ? appointmentsNavItems : []),
  ];
  if (afterMyBusiness.length > 0) items.splice(myBusinessIndex + 1, 0, ...afterMyBusiness);

  const offersIndex = items.findIndex((i) => i.key === "navOffers");
  // "service" listings only ever use /reservations for Real Estate's
  // property-viewing requests (table_reservations reused — see
  // app/[locale]/business/reservations/page.tsx and
  // lib/utils/business-primary-action.ts) — must match that page's own gate
  // exactly, or a Real Estate owner loses the nav link to a page that still
  // works for them.
  const isRealEstateViewings = listing.listingType === "service" && listing.categorySlug === "real-estate";
  const afterOffers = [
    ...(listing.listingType === "hotel" ? [BOOKINGS_NAV_ITEM] : []),
    ...(listing.listingType === "restaurant" || listing.listingType === "cafe" || isRealEstateViewings ? [RESERVATIONS_NAV_ITEM] : []),
  ];
  if (afterOffers.length > 0) items.splice(offersIndex + 1, 0, ...afterOffers);

  if (listing.accessKind !== "granted") return items;

  // Team member: hide any item whose mapped permission isn't in their
  // grant for this business. Items with no mapping (dashboard home,
  // notifications, support) stay visible to anyone with any active grant.
  const perms = listing.permissions ?? {};
  return items.filter((item) => {
    const required = NAV_PERMISSION[item.key];
    return !required || perms[required] === true;
  });
}

const PUBLIC_SEGMENT: Record<OwnedListing["listingType"], string> = {
  hotel: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  service: "services",
  city_service: "city-services",
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
  useScrollLock(mobileOpen);
  const reduceMotion = useReducedMotion();
  const isRtl = locale === "ar";
  const base = `/${locale}/business`;

  function isActive(href: string) {
    const target = `${base}${href}`;
    return href === "" ? pathname === base : pathname.startsWith(target);
  }

  const typeLabel = {
    hotel: t("typeHotel"),
    restaurant: t("typeRestaurant"),
    cafe: t("typeCafe"),
    service: t("typeService"),
    city_service: t("typeCityService"),
  }[listing.listingType];
  const publicHref = `/${locale}/${PUBLIC_SEGMENT[listing.listingType]}/${listing.slug}`;
  const navItems = getNavItems(listing);

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {navItems.map(({ href, icon: Icon, key }) => (
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
      {/* mt- offsets this bar below the global fixed SiteHeader (h-20 +
          safe-area-inset-top, see components/layout/site-header.tsx) —
          without it this row renders at the very top of the page flow and
          the hamburger button sits underneath the header's hit-testing
          area, making it unclickable. */}
      <div className="mt-[calc(env(safe-area-inset-top)+5rem)] flex items-center justify-between border-b border-ink/8 bg-white p-4 dark:border-white/10 dark:bg-ink lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label={t("openMenu")}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/10 dark:border-white/15"
        >
          <Menu size={19} aria-hidden="true" />
        </button>
        <p className="min-w-0 flex-1 truncate px-2 text-center text-sm font-bold">{listing.name}</p>
        <div className="h-10 w-10" aria-hidden="true" />
      </div>

      {/* top/h- match the fixed SiteHeader's height (see the container's own
          lg:pt- in business/layout.tsx) — plain `sticky top-0` would slide
          this back underneath the header once the page scrolls, since 0 is
          measured from the true viewport edge, not this element's own
          (already-offset) starting position. */}
      <aside className="sticky top-[calc(env(safe-area-inset-top)+5rem)] hidden h-[calc(100vh-env(safe-area-inset-top)-5rem)] w-64 shrink-0 flex-col border-e border-ink/8 bg-white dark:border-white/10 dark:bg-ink lg:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="font-display text-lg font-bold text-primary-700">Go Hargeisa</span>
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
              className="fixed inset-0 z-drawer bg-black/50 lg:hidden"
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
              className="fixed inset-y-0 start-0 z-drawer flex w-[85vw] max-w-xs flex-col bg-white shadow-2xl dark:bg-ink lg:hidden"
            >
              <div className="flex items-center justify-between px-5 py-5">
                <span className="font-display text-lg font-bold text-primary-700">Go Hargeisa</span>
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
