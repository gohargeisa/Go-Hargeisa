import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight, Building2, Image as ImageIcon, ShieldCheck, User } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing } from "@/lib/data/business";

export const metadata: Metadata = { title: "Settings — Dashboard", robots: { index: false } };

export default async function BusinessSettingsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/settings`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;

  const t = await getTranslations({ locale, namespace: "businessDashboard" });
  const typeLabel = {
    hotel: t("typeHotel"),
    restaurant: t("typeRestaurant"),
    cafe: t("typeCafe"),
    service: t("typeService"),
    city_service: t("typeCityService"),
  }[listing.listingType];

  const links = [
    { href: `/${locale}/business/listing`, icon: Building2, title: t("navMyBusiness"), description: t("settingsLinkListingDescription") },
    { href: `/${locale}/business/gallery`, icon: ImageIcon, title: t("navGallery"), description: t("settingsLinkGalleryDescription") },
    { href: `/${locale}/dashboard?tab=settings`, icon: User, title: t("settingsLinkAccountTitle"), description: t("settingsLinkAccountDescription") },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("navSettings")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("settingsSubtitle")}</p>
      </div>

      <div className="rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={17} className="text-primary" aria-hidden="true" />
          <h2 className="font-display text-base font-bold">{t("businessInfoTitle")}</h2>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">{t("navMyBusiness")}</dt>
            <dd className="mt-1 font-medium">{listing.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">{t("businessType")}</dt>
            <dd className="mt-1 font-medium">{typeLabel}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-3">
        {links.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-2xl border border-ink/8 bg-white p-4 transition-colors hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-ink/55 dark:text-sand/55">{description}</p>
            </div>
            <ArrowUpRight size={16} className="shrink-0 text-ink/30" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}
