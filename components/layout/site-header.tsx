"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X, ArrowRight, ShoppingCart } from "lucide-react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Locale } from "@/lib/i18n/config";
import { LanguageSwitcher } from "./language-switcher";
import { UserMenu } from "./user-menu";
import { useHeaderUser } from "./use-header-user";
import type { HeaderUser } from "@/lib/supabase/header-user";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { NotificationBell } from "@/components/shared/notification-bell";
import { GlobalSearch } from "@/components/shared/global-search";
import { MegaMenuGrid } from "@/components/layout/nav-mega-menu";
import { categoryHref, categoryDisplayName } from "@/lib/utils/category-href";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import { SUPERMARKET_ENABLED } from "@/lib/config/features";
import type { Category } from "@/types";

// Rendered on every single page (part of the shared header), but its
// contents (search input, grid, keyboard-nav handling) are only needed once
// a visitor actually clicks "More" — code-split out of the main header
// bundle rather than shipped unconditionally on first paint.
const NavMegaMenu = dynamic(() => import("@/components/layout/nav-mega-menu").then((m) => m.NavMegaMenu), {
  ssr: false,
  loading: () => (
    <span className="inline-flex h-9 w-20 animate-pulse rounded-full bg-white/10" aria-hidden="true" />
  ),
});

export function SiteHeader({
  locale,
  initialUser,
  logoUrl,
  categories,
}: {
  locale: Locale;
  initialUser: HeaderUser | null;
  /** Admin-editable override from site_settings.logo_url — falls back to the built-in logo when unset. */
  logoUrl?: string;
  /** Every active, feature-flag-visible category (lib/data/categories.ts
   * getVisibleCategories) — pinned ones render directly in the nav, the
   * rest live in the "More" mega menu. Single source of truth for both. */
  categories: Category[];
}) {
  const t = useTranslations("nav");
  const pinnedCategories = categories.filter((c) => c.isPinned);
  const moreCategories = categories.filter((c) => !c.isPinned);
  const td = useTranslations("dashboard");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useHeaderUser(initialUser);
  const pathname = usePathname();
  const supermarketHref = `/${locale}/supermarket`;
  const supermarketActive = pathname === supermarketHref || pathname.startsWith(`${supermarketHref}/`);
  const mobileNavRef = useRef<HTMLElement>(null);
  useFocusTrap(mobileNavRef, open);
  useScrollLock(open);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] transition-all duration-300 ease-premium ${
        scrolled
          ? "shadow-[0_1px_0_rgba(15,23,42,0.06),0_12px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_1px_0_rgba(255,255,255,0.06),0_12px_30px_rgba(0,0,0,0.3)]"
          : ""
      }`}
    >
      {/* Background + blur live on their own layer behind the nav content,
          not on <header> itself. backdrop-filter (backdrop-blur-*) on an
          element makes it a containing block for any position:fixed
          descendant — with it on <header>, every fixed inset-0 overlay
          nested anywhere under this header (mobile nav backdrop, search
          dialog, notifications backdrop) was being positioned relative to
          this ~80px header bar instead of the real viewport, so the "dark
          backdrop" only ever covered the header strip and every overlay
          looked transparent with page content showing through. Moving the
          filter to this decorative sibling (nothing needs to be fixed
          *inside* it) keeps the exact same visual blur+tint over the same
          header-height area while leaving <header> filter-free, so its
          descendants' fixed positioning resolves against the true viewport
          again. */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-10 transition-all duration-300 ease-premium ${
          scrolled ? "bg-white/95 backdrop-blur-xl dark:bg-ink/90" : "bg-gradient-to-b from-black/35 to-transparent backdrop-blur-md"
        }`}
      />
      <div className="container-px mx-auto flex h-20 items-center gap-3 md:gap-6 lg:gap-8">
        <div className="flex shrink-0 items-center">
          <Link href={`/${locale}`}>
            <Image
              src={logoUrl || "/images/logo.png"}
              alt="Go Hargeisa"
              width={520}
              height={180}
              priority
              className="h-12 sm:h-20 md:h-24 w-auto object-contain"
            />
          </Link>
        </div>

        <nav className="hidden lg:flex flex-1 items-center justify-center gap-2">
          {pinnedCategories.map((category) => {
            const href = categoryHref(locale, category);
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={category.id}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-4 py-2 text-[15px] font-medium transition-all duration-300 ease-premium ${
                  scrolled
                    ? active
                      ? "text-primary-700"
                      : "text-gray-800 hover:text-primary hover:bg-primary/10 dark:text-white/90"
                    : active
                      ? "text-white"
                      : "text-white hover:text-primary hover:bg-white/10"
                }`}
              >
                {categoryDisplayName(category, locale)}
                {active && (
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full ${scrolled ? "bg-primary" : "bg-white"}`}
                  />
                )}
              </Link>
            );
          })}
          {SUPERMARKET_ENABLED && (
            <Link
              href={supermarketHref}
              aria-current={supermarketActive ? "page" : undefined}
              className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-medium transition-all duration-300 ease-premium ${
                scrolled
                  ? supermarketActive
                    ? "text-primary-700"
                    : "text-gray-800 hover:text-primary hover:bg-primary/10 dark:text-white/90"
                  : supermarketActive
                    ? "text-white"
                    : "text-white hover:text-primary hover:bg-white/10"
              }`}
            >
              <ShoppingCart size={15} aria-hidden="true" />
              {t("supermarketLabel")}
              {supermarketActive && (
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full ${scrolled ? "bg-primary" : "bg-white"}`}
                />
              )}
            </Link>
          )}
          {moreCategories.length > 0 && <NavMegaMenu locale={locale} categories={moreCategories} scrolled={scrolled} />}
        </nav>

        <div className="hidden lg:flex shrink-0 items-center gap-3 ms-auto">
          <div
            className={`flex items-center gap-2 ${
              scrolled ? "text-gray-900" : "text-white"
            }`}
          >
            <LanguageSwitcher locale={locale} />
          </div>

          <GlobalSearch locale={locale} scrolled={scrolled} />

          {user && (
            <NotificationBell locale={locale} scrolled={scrolled} isOwner={user.isOwner} isBusinessOwner={user.isBusinessOwner} />
          )}

          {user ? (
            <UserMenu locale={locale} name={user.name} isOwner={user.isOwner} avatarUrl={user.avatarUrl} />
          ) : (
            <Link
              href={`/${locale}/auth/login`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                scrolled
                  ? "text-gray-900 hover:text-primary"
                  : "text-white hover:bg-white/10"
              }`}
            >
              {t("signIn")}
            </Link>
          )}
        </div>

        <div className="ms-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">
          <GlobalSearch locale={locale} scrolled={scrolled} />
          {user && (
            <NotificationBell locale={locale} scrolled={scrolled} isOwner={user.isOwner} isBusinessOwner={user.isBusinessOwner} />
          )}
          <LanguageSwitcher locale={locale} />
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={`relative z-sheet flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 active:scale-90 ${
              scrolled
                ? "border-ink/10 text-ink dark:border-white/15 dark:text-white"
                : "border-white/30 text-white"
            }`}
          >
            {open ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Floating overlay sheet, not an in-flow accordion — pushing page
          content down when the menu opens is the single biggest thing that
          reads as "website nav" rather than a native app; every other
          floating chrome element in this app (bottom-nav, mobile-booking-bar)
          already uses this exact inset-x-3-floating-glass-card vocabulary,
          so this brings the menu in line with it instead of inventing a new
          pattern. */}
      <AnimatePresence>
        {open && (
          <>
            <m.div
              initial={reduceMotion ? undefined : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
              className="fixed inset-0 z-overlay bg-ink/40 backdrop-blur-sm lg:hidden"
            />
            <m.nav
              ref={mobileNavRef}
              initial={reduceMotion ? undefined : { opacity: 0, y: -16, scale: 0.98 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ top: "calc(5rem + env(safe-area-inset-top) + 0.75rem)" }}
              className="glass fixed inset-x-3 z-overlay max-h-[75vh] overflow-y-auto rounded-xl3 shadow-premium-lg lg:hidden"
            >
              <div className="container-px flex flex-col gap-1.5 py-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
              {pinnedCategories.map((category) => {
                const href = categoryHref(locale, category);
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={category.id}
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors ${
                      active
                        ? "bg-primary/10 text-primary-800"
                        : "text-ink hover:bg-primary/5 hover:text-primary dark:text-white"
                    }`}
                  >
                    {categoryDisplayName(category, locale)}
                  </Link>
                );
              })}

              {SUPERMARKET_ENABLED && (
                <Link
                  href={supermarketHref}
                  onClick={() => setOpen(false)}
                  aria-current={supermarketActive ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors ${
                    supermarketActive
                      ? "bg-primary/10 text-primary-800"
                      : "text-ink hover:bg-primary/5 hover:text-primary dark:text-white"
                  }`}
                >
                  <ShoppingCart size={16} aria-hidden="true" />
                  {t("supermarketLabel")}
                </Link>
              )}

              {moreCategories.length > 0 && (
                <div className="mt-1 border-t border-ink/8 pt-3 dark:border-white/10">
                  <p className="px-1 pb-2 text-xs font-bold uppercase tracking-[0.14em] text-ink/40 dark:text-sand/40">
                    {t("moreCategoriesLabel")}
                  </p>
                  <MegaMenuGrid locale={locale} categories={moreCategories} onNavigate={() => setOpen(false)} />
                  <Link
                    href={`/${locale}/services`}
                    onClick={() => setOpen(false)}
                    className="mt-2 flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-semibold text-primary-700"
                  >
                    {t("browseAllCategories")}
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              )}

              {user ? (
                <div className="mt-3 space-y-2 border-t border-ink/8 px-1 pt-3 dark:border-white/10">
                  <Link
                    href={`/${locale}/dashboard`}
                    onClick={() => setOpen(false)}
                    className="block rounded-full border border-ink/15 py-2.5 text-center text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white dark:hover:border-primary"
                  >
                    {td("myDashboard")}
                  </Link>

                  {user.isOwner && (
                    <Link
                      href={`/${locale}/admin`}
                      onClick={() => setOpen(false)}
                      className="block rounded-full border border-ink/15 py-2.5 text-center text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white dark:hover:border-primary"
                    >
                      {td("adminDashboard")}
                    </Link>
                  )}

                  <SignOutButton locale={locale} className="w-full flex items-center justify-center gap-2 rounded-full bg-primary-700 py-2.5 text-sm font-semibold text-white" />
                </div>
              ) : (
                <div className="mt-3 border-t border-ink/8 pt-3 dark:border-white/10">
                  <Link
                    href={`/${locale}/auth/login`}
                    className="block rounded-full border border-ink/15 py-2.5 text-center text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white dark:hover:border-primary"
                  >
                    {t("signIn")}
                  </Link>
                </div>
              )}
              </div>
            </m.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}