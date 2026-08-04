import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireListingsAccess } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { HotelForm } from "@/components/admin/hotel-form";
import { getRestaurants } from "@/lib/data/restaurants";
import { getCafes } from "@/lib/data/cafes";
import type { MediaVideo, OpeningHoursGroup } from "@/types";

export const metadata: Metadata = { title: "Edit Hotel — Admin" };

export default async function EditHotelPage({
  params: { locale, id },
}: {
  params: { locale: Locale; id: string };
}) {
  const access = await requireListingsAccess(locale, `/${locale}/admin/hotels/${id}/edit`);
  const t = await getTranslations({ locale, namespace: "admin" });

  if (!isSupabaseConfigured()) {
    return (
      <section className="container-px mx-auto py-14">
        <p className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6 text-sm text-ink/60 dark:text-sand/60">
          {t("editingRequiresSupabaseLong")}
        </p>
      </section>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const hotel = data as unknown as Database["public"]["Tables"]["hotels"]["Row"];

  // Business owners may only edit hotels assigned to them — RLS enforces
  // this on the actual write, but block the read here too so they can't
  // view another owner's listing details in the form.
  if (access?.role === "business_owner" && hotel.owner_id !== access.userId) {
    notFound();
  }

  const [restaurants, cafes, { data: roomRows }] = await Promise.all([
    getRestaurants(),
    getCafes(),
    supabase.from("hotel_rooms" as any).select("*, room_images(*)").eq("hotel_id", hotel.id).order("sort_order", { ascending: true }),
  ]);

  const gallery = Array.isArray(hotel.gallery)
    ? (hotel.gallery as unknown as { url: string; alt?: string; category?: string }[])
    : [];

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">{t("editHotelTitle")}</h1>
      <HotelForm
        locale={locale}
        mode="edit"
        hotelId={hotel.id}
        restaurantOptions={restaurants.map((r) => ({ id: r.id, name: r.name }))}
        cafeOptions={cafes.map((c) => ({ id: c.id, name: c.name }))}
        initialRooms={(roomRows ?? []).map((r: any) => ({
          id: r.id,
          name: r.name,
          image: r.image ?? "",
          images: Array.isArray(r.room_images)
            ? [...r.room_images].sort((a, b) => a.sort_order - b.sort_order).map((img: any) => img.url)
            : [],
          description: r.description ?? "",
          sizeSqm: r.size_sqm ?? undefined,
          maxGuests: r.max_guests,
          bedType: r.bed_type ?? "",
          bathrooms: r.bathrooms ?? 1,
          features: r.features ?? [],
          pricePerNight: r.price_per_night != null ? Number(r.price_per_night) : undefined,
          weekendPrice: r.weekend_price != null ? Number(r.weekend_price) : undefined,
          discountPrice: r.discount_price != null ? Number(r.discount_price) : undefined,
          totalRooms: r.total_rooms ?? 1,
          roomType: r.room_type ?? "standard",
          isAvailable: r.is_available ?? true,
        }))}
        initial={{
          slug: hotel.slug,
          name: hotel.name,
          shortDescription: hotel.short_description,
          description: hotel.description,
          coverImage: hotel.cover_image,
          logo: hotel.logo_url ?? "",
          gallery: gallery as any,
          videos: Array.isArray(hotel.videos) ? (hotel.videos as unknown as MediaVideo[]) : [],
          address: hotel.address,
          lat: hotel.lat,
          lng: hotel.lng,
          googleMapsUrl: hotel.google_maps_url ?? "",
          phone: hotel.phone ?? "",
          website: hotel.website ?? "",
          whatsapp: hotel.whatsapp ?? "",
          email: hotel.email ?? "",
          socialInstagram: hotel.social_instagram ?? "",
          socialFacebook: hotel.social_facebook ?? "",
          socialTiktok: hotel.social_tiktok ?? "",
          socialSnapchat: hotel.social_snapchat ?? "",
          socialX: hotel.social_x ?? "",
          socialYoutube: hotel.social_youtube ?? "",
          socialTelegram: hotel.social_telegram ?? "",
          priceRange: hotel.price_range,
          amenities: hotel.amenities ?? [],
          amenitiesV2: hotel.amenities_v2 ?? [],
          openingHoursStructured: Array.isArray(hotel.opening_hours_structured)
            ? (hotel.opening_hours_structured as unknown as OpeningHoursGroup[])
            : [],
          is24Hours: hotel.is_24_hours,
          temporarilyClosed: hotel.temporarily_closed,
          permanentlyClosed: hotel.permanently_closed,
          checkInTime: hotel.check_in_time ?? "",
          checkOutTime: hotel.check_out_time ?? "",
          languages: hotel.languages ?? [],
          restaurantId: hotel.restaurant_id ?? "",
          cafeId: hotel.cafe_id ?? "",
          featured: hotel.featured,
          bookingMode: hotel.booking_mode ?? "go_hargeisa",
          externalBookingOption: hotel.external_booking_option ?? "",
          externalBookingUrl: hotel.external_booking_url ?? "",
          bookingWhatsapp: hotel.booking_whatsapp ?? "",
          bookingComUrl: hotel.booking_com_url ?? "",
        }}
      />
    </section>
  );
}
