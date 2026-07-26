import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireListingsAccess } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { HotelForm } from "@/components/admin/hotel-form";

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

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">{t("editHotelTitle")}</h1>
      <HotelForm
        locale={locale}
        mode="edit"
        hotelId={hotel.id}
        initial={{
          slug: hotel.slug,
          name: hotel.name,
          shortDescription: hotel.short_description,
          description: hotel.description,
          coverImage: hotel.cover_image,
          address: hotel.address,
          lat: hotel.lat,
          lng: hotel.lng,
          phone: hotel.phone ?? "",
          website: hotel.website ?? "",
          priceRange: hotel.price_range,
          amenities: hotel.amenities ?? [],
          featured: hotel.featured,
        }}
      />
    </section>
  );
}
