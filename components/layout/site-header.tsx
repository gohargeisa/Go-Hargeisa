"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Locale } from "@/lib/i18n/config";
import { LanguageSwitcher } from "./language-switcher";
import { UserMenu } from "./user-menu";
import { useHeaderUser } from "./use-header-user";
import type { HeaderUser } from "@/lib/supabase/header-user";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { SERVICES_PUBLIC_ENABLED } from "@/lib/config/features";

const links = [
  { key: "hotels", href: "hotels" },
  { key: "restaurants", href: "restaurants" },
  { key: "cafes", href: "cafes" },
  ...(SERVICES_PUBLIC_ENABLED ? [{ key: "services", href: "services" }] : []),
] as const;

export function SiteHeader({ locale, initialUser }: { locale: Locale; initialUser: HeaderUser | null }) {
  const t = useTranslations("nav");
  const td = useTranslations("dashboard");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useHeaderUser(initialUser);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-premium ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-[0_1px_0_rgba(15,23,42,0.06),0_12px_30px_rgba(15,23,42,0.08)] dark:bg-ink/90 dark:shadow-[0_1px_0_rgba(255,255,255,0.06),0_12px_30px_rgba(0,0,0,0.3)]"
          : "bg-gradient-to-b from-black/35 to-transparent backdrop-blur-md"
      }`}
    >
      <div className="container-px mx-auto flex h-20 items-center gap-3 md:gap-6 lg:gap-8">
        <div className="flex shrink-0 items-center">
          <Link href={`/${locale}`}>
            <Image
              src="/images/logo.png"
              alt="Go Hargeisa"
              width={520}
              height={180}
              priority
              className="h-12 sm:h-20 md:h-24 w-auto object-contain"
            />
          </Link>
        </div>

        <nav className="hidden lg:flex flex-1 items-center justify-center gap-2">
          {links.map((l) => {
            const href = `/${locale}/${l.href}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={l.key}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-4 py-2 text-[15px] font-medium transition-all duration-300 ease-premium ${
                  scrolled
                    ? active
                      ? "text-primary"
                      : "text-gray-800 hover:text-primary hover:bg-primary/10 dark:text-white/90"
                    : active
                      ? "text-white"
                      : "text-white hover:text-primary hover:bg-white/10"
                }`}
              >
                {t(l.key)}
                {active && (
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full ${scrolled ? "bg-primary" : "bg-white"}`}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex shrink-0 items-center gap-3 ms-auto">
          <div
            className={`flex items-center gap-2 ${
              scrolled ? "text-gray-900" : "text-white"
            }`}
          >
            <LanguageSwitcher locale={locale} />
          </div>

          {user ? (
            <UserMenu
              locale={locale}
              name={user.name}
              isOwner={user.isOwner}
              isBusinessOwner={user.isBusinessOwner}
              avatarUrl={user.avatarUrl}
            />
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
          <LanguageSwitcher locale={locale} />
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 dark:border-white/15"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-hidden glass border-t border-ink/5 dark:border-white/10"
          >
            <div className="container-px mx-auto flex flex-col gap-1.5 py-4">
              {links.map((l) => {
                const href = `/${locale}/${l.href}`;
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={l.key}
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-ink hover:bg-primary/5 hover:text-primary dark:text-white"
                    }`}
                  >
                    {t(l.key)}
                  </Link>
                );
              })}

              {user ? (
                <div className="mt-3 space-y-2 border-t border-ink/8 px-1 pt-3 dark:border-white/10">
                  <Link
                    href={`/${locale}/dashboard`}
                    onClick={() => setOpen(false)}
                    className="block rounded-full border border-ink/15 py-2.5 text-center text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white dark:hover:border-primary"
                  >
                    {td("myDashboard")}
                  </Link>

                  <Link
                    href={`/${locale}/dashboard?tab=profile`}
                    onClick={() => setOpen(false)}
                    className="block rounded-full border border-ink/15 py-2.5 text-center text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white dark:hover:border-primary"
                  >
                    {td("tabProfile")}
                  </Link>

                  <Link
                    href={`/${locale}/dashboard?tab=settings`}
                    onClick={() => setOpen(false)}
                    className="block rounded-full border border-ink/15 py-2.5 text-center text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white dark:hover:border-primary"
                  >
                    {td("settings")}
                  </Link>

                  {user.isBusinessOwner && (
                    <Link
                      href={`/${locale}/business`}
                      onClick={() => setOpen(false)}
                      className="block rounded-full border border-ink/15 py-2.5 text-center text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white dark:hover:border-primary"
                    >
                      {td("manageListings")}
                    </Link>
                  )}
                  {user.isOwner && (
                    <Link
                      href={`/${locale}/admin`}
                      onClick={() => setOpen(false)}
                      className="block rounded-full border border-ink/15 py-2.5 text-center text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white dark:hover:border-primary"
                    >
                      {td("adminDashboard")}
                    </Link>
                  )}

                  <SignOutButton locale={locale} className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-white" />
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
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}