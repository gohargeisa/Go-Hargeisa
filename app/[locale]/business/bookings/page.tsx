import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing, getBookingsForHotel } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { mapHotelRoom } from "@/lib/data/mappers";
import { BookingsTable } from "@/components/business/bookings-table";

export const metadata: Metadata = { title: "Bookings — Dashboard", robots: { index: false } };

export default async function BookingsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/bookings`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;

  const t = await getTranslations({ locale, namespace: "businessDashboard" });

  if (listing.listingType !== "hotel") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 p-12 text-center dark:border-white/15">
        <CalendarDays size={26} className="text-ink/25" aria-hidden="true" />
        <p className="font-medium text-ink/60 dark:text-sand/60">{t("bookingsHotelOnly")}</p>
      </div>
    );
  }

  const supabase = await createClient();
  const [bookings, { data: roomRows }] = await Promise.all([
    getBookingsForHotel(listing.id),
    supabase.from("hotel_rooms").select("*").eq("hotel_id", listing.id).order("sort_order", { ascending: true }),
  ]);
  const rooms = (roomRows ?? []).map((r) => mapHotelRoom(r));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">{t("navBookings")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("bookingsSubtitle")}</p>
      </div>
      <BookingsTable hotelId={listing.id} bookings={bookings} rooms={rooms} revalidatePath={currentPath} />
    </div>
  );
}
