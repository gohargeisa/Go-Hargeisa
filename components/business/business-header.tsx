"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { BusinessSwitcher } from "@/components/business/business-switcher";
import type { Locale } from "@/lib/i18n/config";
import type { OwnedListing } from "@/lib/data/business";

export function BusinessHeader({
  locale,
  businessName,
  ownerName,
  unreadCount,
  businesses,
  activeListing,
}: {
  locale: Locale;
  businessName: string;
  ownerName: string;
  unreadCount: number;
  /** Every OFFICIAL listing this user owns — 1 entry for the common case,
   * 2+ for a multi-business partner (e.g. Lavender Café + Lavender
   * Flowers). BusinessSwitcher only renders a picker when there's more
   * than one; a single business keeps the plain name, unchanged. */
  businesses: OwnedListing[];
  activeListing: OwnedListing;
}) {
  const t = useTranslations("businessDashboard");
  const today = new Intl.DateTimeFormat(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(
    new Date()
  );

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/8 bg-white px-5 py-4 dark:border-white/10 dark:bg-ink sm:px-8">
      <div className="min-w-0">
        {businesses.length > 1 ? (
          <BusinessSwitcher businesses={businesses} activeListing={activeListing} />
        ) : (
          <p className="truncate font-display text-lg font-bold">{businessName}</p>
        )}
        <p className="truncate text-xs text-ink/50 dark:text-sand/50">
          {t("ownerLabel")} {ownerName}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <p className="hidden text-sm text-ink/55 dark:text-sand/55 md:block">{today}</p>

        <Link
          href={`/${locale}/business/messages`}
          aria-label={t("notifications")}
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/15 dark:text-white"
        >
          <Bell size={18} aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-700 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
}
