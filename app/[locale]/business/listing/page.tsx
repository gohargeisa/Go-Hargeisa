import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { MyBusinessForm } from "@/components/business/my-business-form";
import { ServiceBadges } from "@/components/business/service-badges";
import { HotelBookingSettingsForm } from "@/components/business/hotel-booking-settings-form";
import type { HotelBookingMode, HotelExternalBookingOption } from "@/types";

export const metadata: Metadata = { title: "My Business — Dashboard", robots: { index: false } };

export default async function MyBusinessPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/listing`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;

  const t = await getTranslations({ locale, namespace: "businessDashboard" });
  const supabase = await createClient();
  const table = listing.listingType === "hotel" ? "hotels" : listing.listingType === "restaurant" ? "restaurants" : "cafes";
  const { data: row } = await supabase.from(table).select("*").eq("id", listing.id).single();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("navMyBusiness")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("myBusinessSubtitle")}</p>
      </div>

      <MyBusinessForm
        listingType={listing.listingType}
        listingId={listing.id}
        currentPath={currentPath}
        initial={{
          name: row?.name ?? listing.name,
          shortDescription: row?.short_description ?? "",
          description: row?.description ?? "",
          address: row?.address ?? listing.address,
          phone: row?.phone ?? listing.phone ?? "",
          website: (row as { website?: string })?.website ?? listing.website ?? "",
          checkInTime: (row as { check_in_time?: string })?.check_in_time ?? "",
          checkOutTime: (row as { check_out_time?: string })?.check_out_time ?? "",
          openingHours: (row as { opening_hours?: string })?.opening_hours ?? "",
        }}
      />

      {listing.listingType === "hotel" && (
        <HotelBookingSettingsForm
          hotelId={listing.id}
          currentPath={currentPath}
          initial={{
            bookingMode: ((row as { booking_mode?: HotelBookingMode })?.booking_mode ?? "go_hargeisa"),
            externalBookingOption:
              (row as { external_booking_option?: HotelExternalBookingOption | null })?.external_booking_option ?? "",
            externalBookingUrl: (row as { external_booking_url?: string })?.external_booking_url ?? "",
            bookingWhatsapp: (row as { booking_whatsapp?: string })?.booking_whatsapp ?? "",
            bookingComUrl: (row as { booking_com_url?: string })?.booking_com_url ?? "",
            website: (row as { website?: string })?.website ?? "",
          }}
        />
      )}

      <ServiceBadges listingType={listing.listingType} listingId={listing.id} tags={listing.serviceTags} currentPath={currentPath} />
    </div>
  );
}
