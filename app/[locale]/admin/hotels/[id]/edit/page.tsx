import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { HotelForm } from "@/components/admin/hotel-form";

export const metadata: Metadata = { title: "Edit Hotel — Admin" };

export default async function EditHotelPage({
  params: { locale, id },
}: {
  params: { locale: Locale; id: string };
}) {
  await requireAdmin(locale, `/${locale}/admin/hotels/${id}/edit`);

  if (!isSupabaseConfigured()) {
    return (
      <section className="container-px mx-auto py-14">
        <p className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6 text-sm text-ink/60 dark:text-sand/60">
          Editing requires a connected Supabase project. See the README to connect one, then this form will
          load and save real data.
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

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">Edit Hotel</h1>
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
