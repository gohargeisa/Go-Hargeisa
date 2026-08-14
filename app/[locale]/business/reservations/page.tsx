import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CalendarClock } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing } from "@/lib/data/business";
import { getReservationsForListing } from "@/lib/data/reservations";
import { ReservationsTable } from "@/components/business/reservations-table";

export const metadata: Metadata = { title: "Reservations — Dashboard", robots: { index: false } };

export default async function ReservationsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/reservations`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;

  const t = await getTranslations({ locale, namespace: "businessDashboard" });

  if (listing.listingType !== "restaurant" && listing.listingType !== "cafe") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 p-12 text-center dark:border-white/15">
        <CalendarClock size={26} className="text-ink/25" aria-hidden="true" />
        <p className="font-medium text-ink/60 dark:text-sand/60">{t("reservationsRestaurantCafeOnly")}</p>
      </div>
    );
  }

  const reservations = await getReservationsForListing(listing.listingType, listing.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">{t("reservationsTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("reservationsSubtitle")}</p>
      </div>
      <ReservationsTable
        listingType={listing.listingType}
        listingId={listing.id}
        reservations={reservations}
        revalidatePath={currentPath}
      />
    </div>
  );
}
