"use client";

import { SidebarNav } from "@/components/shared/sidebar-nav";
import { useAdminNavItems } from "@/lib/hooks/use-admin-nav-items";
import { useTranslations } from "next-intl";
import type { Locale } from "@/lib/i18n/config";

/** Persistent admin nav — one place every /admin/* page is reachable from,
 * replacing the old per-page hero pill-link rows. "Businesses" groups every
 * per-vertical admin page (each still has its own dedicated table/route —
 * see the categories system's target_table design) instead of a single
 * merged list, since consolidating 6+ differently-shaped tables into one
 * CRUD view would be a much larger rebuild than a navigation reorganization.
 * Item list itself lives in useAdminNavItems — shared with the mobile
 * hamburger menu (components/layout/site-header.tsx) so both list exactly
 * the same sections. */
export function AdminSidebar({ locale }: { locale: Locale }) {
  const t = useTranslations("admin");
  const { primaryItems, moreItems } = useAdminNavItems(locale);

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
      <SidebarNav items={primaryItems} ariaLabel={t("adminSectionsAriaLabel")} />
      <SidebarNav items={moreItems} ariaLabel={t("adminMoreSectionsAriaLabel")} />
    </div>
  );
}
