import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PackageSearch } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing } from "@/lib/data/business";
import { getPurchaseRequestsForListing } from "@/lib/data/purchase-requests";
import { PurchaseRequestsTable } from "@/components/business/purchase-requests-table";

export const metadata: Metadata = { title: "Purchase Requests — Dashboard", robots: { index: false } };

export default async function BusinessPurchaseRequestsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/requests`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;

  const t = await getTranslations({ locale, namespace: "purchaseRequest" });

  if (!listing.supportsPurchaseRequests) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 p-12 text-center dark:border-white/15">
        <PackageSearch size={26} className="text-ink/25" aria-hidden="true" />
        <p className="font-medium text-ink/60 dark:text-sand/60">{t("notEnabledForThisBusiness")}</p>
      </div>
    );
  }

  const requests = await getPurchaseRequestsForListing(listing.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">{t("dashboardTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("dashboardSubtitle")}</p>
      </div>
      <PurchaseRequestsTable listingId={listing.id} requests={requests} />
    </div>
  );
}
