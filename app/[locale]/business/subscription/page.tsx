import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing, getOrCreateSubscription, getOwnerProfile } from "@/lib/data/business";
import { SubscriptionCard } from "@/components/business/subscription-card";

export const metadata: Metadata = { title: "Subscription — Dashboard", robots: { index: false } };

export default async function SubscriptionPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/subscription`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;

  const t = await getTranslations({ locale, namespace: "businessDashboard" });
  const [subscription, owner] = await Promise.all([
    getOrCreateSubscription(listing.listingType, listing.id),
    getOwnerProfile(),
  ]);

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">{t("navSubscription")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("subscriptionSubtitle")}</p>
      </div>
      <SubscriptionCard subscription={subscription} ownerName={owner.name} ownerEmail={owner.email} />
    </div>
  );
}
