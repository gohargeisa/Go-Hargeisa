import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Tag } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing, getOffersForListing } from "@/lib/data/business";
import { OffersManager } from "@/components/business/offers-manager";

export const metadata: Metadata = { title: "Offers — Dashboard", robots: { index: false } };

export default async function OffersPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/offers`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;

  const t = await getTranslations({ locale, namespace: "businessDashboard" });

  if (listing.listingType === "service") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 p-12 text-center dark:border-white/15">
        <Tag size={26} className="text-ink/25" aria-hidden="true" />
        <p className="font-medium text-ink/60 dark:text-sand/60">{t("offersNotAvailable")}</p>
      </div>
    );
  }

  const offers = await getOffersForListing(listing.listingType, listing.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">{t("navOffers")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("offersSubtitle")}</p>
      </div>
      <OffersManager listingType={listing.listingType} listingId={listing.id} offers={offers} revalidatePath={currentPath} />
    </div>
  );
}
