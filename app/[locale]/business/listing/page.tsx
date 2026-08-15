import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { MyBusinessForm } from "@/components/business/my-business-form";
import { ServiceBadges } from "@/components/business/service-badges";
import { HotelBookingSettingsForm } from "@/components/business/hotel-booking-settings-form";
import { HotelRoomsManager } from "@/components/admin/hotel-rooms-manager";
import { RestaurantOrderingSettingsForm } from "@/components/business/restaurant-ordering-settings-form";
import type { HotelBookingMode, HotelExternalBookingOption, BusinessListingType } from "@/types";

export const metadata: Metadata = { title: "My Business — Dashboard", robots: { index: false } };

const TABLE_BY_TYPE: Record<BusinessListingType, "hotels" | "restaurants" | "cafes" | "services" | "city_services"> = {
  hotel: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  service: "services",
  city_service: "city_services",
};

export default async function MyBusinessPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/listing`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;

  const t = await getTranslations({ locale, namespace: "businessDashboard" });
  const supabase = await createClient();
  const table = TABLE_BY_TYPE[listing.listingType];
  const { data: row } = await supabase.from(table).select("*").eq("id", listing.id).single();

  const { data: roomRows } =
    listing.listingType === "hotel"
      ? await supabase.from("hotel_rooms" as any).select("*").eq("hotel_id", listing.id).order("sort_order", { ascending: true })
      : { data: null };

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
        categorySlug={listing.categorySlug}
        initial={{
          name: row?.name ?? listing.name,
          shortDescription: row?.short_description ?? "",
          description: row?.description ?? "",
          address: row?.address ?? listing.address,
          phone: row?.phone ?? listing.phone ?? "",
          website: (row as { website?: string })?.website ?? listing.website ?? "",
          whatsapp: (row as { whatsapp?: string })?.whatsapp ?? "",
          email: (row as { email?: string })?.email ?? "",
          socialInstagram: (row as { social_instagram?: string })?.social_instagram ?? "",
          socialFacebook: (row as { social_facebook?: string })?.social_facebook ?? "",
          // city_services' equivalent column is `maps_url`, not `google_maps_url`.
          googleMapsUrl:
            listing.listingType === "city_service"
              ? ((row as { maps_url?: string })?.maps_url ?? "")
              : ((row as { google_maps_url?: string })?.google_maps_url ?? ""),
          priceRange: (row as { price_range?: "$" | "$$" | "$$$" | "$$$$" })?.price_range ?? "$$",
          checkInTime: (row as { check_in_time?: string })?.check_in_time ?? "",
          checkOutTime: (row as { check_out_time?: string })?.check_out_time ?? "",
          openingHours: (row as { opening_hours?: string })?.opening_hours ?? "",
          openingHoursStructured: (row as { opening_hours_structured?: any })?.opening_hours_structured ?? [],
          menuHighlights: (row as { menu?: { name: string; price: string; description?: string }[] })?.menu ?? [],
          menuPdfUrl: (row as { menu_pdf_url?: string })?.menu_pdf_url ?? "",
          documentUrl: (row as { document_url?: string })?.document_url ?? "",
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

      {listing.listingType === "hotel" && (
        <HotelRoomsManager
          hotelId={listing.id}
          locale={locale}
          initialRooms={(roomRows ?? []).map((r: any) => ({
            id: r.id,
            name: r.name,
            image: r.image ?? "",
            sizeSqm: r.size_sqm ?? undefined,
            maxGuests: r.max_guests,
            bedType: r.bed_type ?? "",
            features: r.features ?? [],
            pricePerNight: r.price_per_night != null ? Number(r.price_per_night) : undefined,
            roomType: r.room_type ?? "standard",
            isAvailable: r.is_available ?? true,
          }))}
          revalidatePaths={[currentPath, `/${locale}/hotels/${listing.slug}`]}
        />
      )}

      {listing.listingType === "restaurant" && (
        <RestaurantOrderingSettingsForm
          restaurantId={listing.id}
          currentPath={currentPath}
          initial={{
            reservable: (row as { reservable?: boolean })?.reservable ?? false,
            onlineOrderingEnabled: (row as { online_ordering_enabled?: boolean })?.online_ordering_enabled ?? false,
            onlineOrderUrl: (row as { online_order_url?: string })?.online_order_url ?? "",
            phoneOrderingEnabled: (row as { phone_ordering_enabled?: boolean })?.phone_ordering_enabled ?? false,
          }}
        />
      )}

      <ServiceBadges listingType={listing.listingType} listingId={listing.id} tags={listing.serviceTags} currentPath={currentPath} />
    </div>
  );
}
