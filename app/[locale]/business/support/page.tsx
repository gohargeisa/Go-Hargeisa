import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing, getOwnerProfile } from "@/lib/data/business";
import { SupportCard } from "@/components/business/support-card";

export const metadata: Metadata = { title: "Support — Dashboard", robots: { index: false } };

export default async function SupportPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/support`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;

  const t = await getTranslations({ locale, namespace: "businessDashboard" });
  const owner = await getOwnerProfile();

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">{t("navSupport")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("supportSubtitle")}</p>
      </div>
      <SupportCard ownerName={owner.name} ownerEmail={owner.email} />
    </div>
  );
}
