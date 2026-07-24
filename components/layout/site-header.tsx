"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Locale } from "@/lib/i18n/config";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { useHeaderUser } from "./use-header-user";
import { SignOutButton } from "@/components/shared/sign-out-button";

const links = [
  { key: "hotels", href: "hotels" },
  { key: "restaurants", href: "restaurants" },
  { key: "cafes", href: "cafes" },
  { key: "events", href: "events" },
] as const;

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, loading } = useHeaderUser();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-lg"
          : "bg-gradient-to-b from-black/35 to-transparent backdrop-blur-md"
      }`}
    >
      <div className="container-px mx-auto flex h-20 items-center gap-8">
        <div className="flex shrink-0 items-center">
          <Link href={`/${locale}`}>
            <Image
              src="/images/logo.png"
              alt="Go Hargeisa"
              width={520}
              height={180}
              priority
              className="h-20 md:h-24 w-auto object-contain"
            />
          </Link>
        </div>

        <nav className="hidden lg:flex flex-1 items-center justify-center gap-8">
          {links.map((l) => (
            <Link
              key={l.key}
              href={`/${locale}/${l.href}`}
              className={`rounded-full px-4 py-2 text-[15px] font-medium transition-all duration-300 ${
                scrolled
                  ? "text-gray-800 hover:text-primary hover:bg-primary/10"
                  : "text-white hover:text-primary hover:bg-white/10"
              }`}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex shrink-0 items-center gap-3 ml-auto">
          <div
            className={`flex items-center gap-2 ${
              scrolled ? "text-gray-900" : "text-white"
            }`}
          >
            <LanguageSwitcher locale={locale} />
            <ThemeToggle />
          </div>

          {loading ? (
            <div className="h-9 w-24 rounded-full bg-ink/5 dark:bg-white/10 animate-pulse" />
          ) : user ? (
            <UserMenu
              locale={locale}
              name={user.name}
              isOwner={user.isOwner}
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

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher locale={locale} />
          <ThemeToggle />
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
            className="lg:hidden overflow-hidden glass border-t border-ink/5 dark:border-white/10"
          >
            <div className="container-px mx-auto flex flex-col py-4">
              {links.map((l) => (
                <Link
                  key={l.key}
                  href={`/${locale}/${l.href}`}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-12 py-4 rounded-full font-semibold shadow-lg text-sm font-medium hover:bg-primary/5 hover:text-primary"
                >
                  {t(l.key)}
                </Link>
              ))}

              {user ? (
                <div className="mt-2 space-y-2 px-3">
                  <Link
                    href={`/${locale}/dashboard`}
                    onClick={() => setOpen(false)}
                    className="block rounded-full border border-ink/15 dark:border-white/20 py-2.5 text-center text-sm font-semibold"
                  >
                    My Dashboard
                  </Link>

                  {user.isOwner && (
                    <Link
                      href={`/${locale}/admin`}
                      onClick={() => setOpen(false)}
                      className="block rounded-full border border-ink/15 dark:border-white/20 py-2.5 text-center text-sm font-semibold"
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  <SignOutButton className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-white" />
                </div>
              ) : (
                !loading && (
                  <div className="mt-2 px-3">
                    <Link
                      href={`/${locale}/auth/login`}
                      className="block rounded-full border border-ink/15 dark:border-white/20 py-2.5 text-center text-sm font-semibold"
                    >
                      {t("signIn")}
                    </Link>
                  </div>
                )
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}