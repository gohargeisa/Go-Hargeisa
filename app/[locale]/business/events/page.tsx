import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PartyPopper } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing } from "@/lib/data/business";
import { getEventRequestsForListing } from "@/lib/data/event-requests";
import { EventRequestsTable } from "@/components/business/event-requests-table";

export const metadata: Metadata = { title: "Event Requests — Dashboard", robots: { index: false } };

export default async function BusinessEventRequestsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/events`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;

  const t = await getTranslations({ locale, namespace: "eventRequest" });

  if (!listing.supportsEventRequests) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 p-12 text-center dark:border-white/15">
        <PartyPopper size={26} className="text-ink/25" aria-hidden="true" />
        <p className="font-medium text-ink/60 dark:text-sand/60">{t("notEnabledForThisBusiness")}</p>
      </div>
    );
  }

  const requests = await getEventRequestsForListing(listing.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">{t("dashboardTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("dashboardSubtitle")}</p>
      </div>
      <EventRequestsTable listingId={listing.id} requests={requests} />
    </div>
  );
}
