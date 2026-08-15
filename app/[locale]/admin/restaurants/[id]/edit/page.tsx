import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireListingsAccess } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { RestaurantForm } from "@/components/admin/restaurant-form";
import type { OpeningHoursGroup, MediaVideo } from "@/types";

export const metadata: Metadata = { title: "Edit Restaurant — Admin" };

export default async function EditRestaurantPage({
  params: { locale, id },
}: {
  params: { locale: Locale; id: string };
}) {
  const access = await requireListingsAccess(locale, `/${locale}/admin/restaurants/${id}/edit`);
  const t = await getTranslations({ locale, namespace: "admin" });

  if (!isSupabaseConfigured()) {
    return (
      <section className="container-px mx-auto py-14">
        <p className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6 text-sm text-ink/60 dark:text-sand/60">
          {t("editingRequiresSupabaseShort")}
        </p>
      </section>
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const restaurant =
    data as unknown as Database["public"]["Tables"]["restaurants"]["Row"];

  if (access?.role === "business_owner" && restaurant.owner_id !== access.userId) {
    notFound();
  }

  const gallery = Array.isArray(restaurant.gallery)
    ? (restaurant.gallery as unknown as { url: string; alt?: string; category?: string }[])
    : [];

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">
        {t("editRestaurantTitle")}
      </h1>

      <RestaurantForm
        locale={locale}
        mode="edit"
        restaurantId={restaurant.id}
        canFeature={access?.role === "owner"}
        initial={{
          slug: restaurant.slug,
          name: restaurant.name,
          shortDescription: restaurant.short_description,
          description: restaurant.description,
          coverImage: restaurant.cover_image,
          logo: restaurant.logo_url ?? "",
          gallery: gallery as any,
          videos: Array.isArray(restaurant.videos) ? (restaurant.videos as unknown as MediaVideo[]) : [],
          address: restaurant.address,
          lat: restaurant.lat,
          lng: restaurant.lng,
          googleMapsUrl: restaurant.google_maps_url ?? "",
          phone: restaurant.phone ?? "",
          website: restaurant.website ?? "",
          whatsapp: restaurant.whatsapp ?? "",
          email: restaurant.email ?? "",
          socialInstagram: restaurant.social_instagram ?? "",
          socialFacebook: restaurant.social_facebook ?? "",
          socialTiktok: restaurant.social_tiktok ?? "",
          socialSnapchat: restaurant.social_snapchat ?? "",
          socialX: restaurant.social_x ?? "",
          socialYoutube: restaurant.social_youtube ?? "",
          socialTelegram: restaurant.social_telegram ?? "",
          cuisine: (restaurant.cuisine ?? []) as string[],
          priceRange:
            restaurant.price_range === "$$$$"
              ? "$$$"
              : restaurant.price_range,
          openingHours: restaurant.opening_hours ?? "",
          openingHoursStructured: Array.isArray(restaurant.opening_hours_structured)
            ? (restaurant.opening_hours_structured as unknown as OpeningHoursGroup[])
            : [],
          is24Hours: restaurant.is_24_hours,
          temporarilyClosed: restaurant.temporarily_closed,
          permanentlyClosed: restaurant.permanently_closed,
          menuHighlights: Array.isArray(restaurant.menu)
            ? (restaurant.menu as unknown as {
                name: string;
                price: string;
                description?: string;
              }[])
            : [],
          menuPdfUrl: restaurant.menu_pdf_url ?? "",
          reservable: restaurant.reservable,
          featured: restaurant.featured,
          isPartner: restaurant.is_partner,
          amenitiesV2: restaurant.amenities_v2 ?? [],
          restaurantType: restaurant.restaurant_type ?? "",
          seatingCapacity: restaurant.seating_capacity ?? undefined,
          numberOfTables: restaurant.number_of_tables ?? undefined,
          onlineOrderUrl: restaurant.online_order_url ?? "",
          onlineOrderingEnabled: restaurant.online_ordering_enabled,
          phoneOrderingEnabled: restaurant.phone_ordering_enabled,
          languages: restaurant.languages ?? [],
        }}
      />
    </section>
  );
}