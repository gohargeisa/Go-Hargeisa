import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { RestaurantForm } from "@/components/admin/restaurant-form";

export const metadata: Metadata = { title: "Edit Restaurant — Admin" };

export default async function EditRestaurantPage({
  params: { locale, id },
}: {
  params: { locale: Locale; id: string };
}) {
  await requireAdmin(locale, `/${locale}/admin/restaurants/${id}/edit`);

  if (!isSupabaseConfigured()) {
    return (
      <section className="container-px mx-auto py-14">
        <p className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6 text-sm text-ink/60 dark:text-sand/60">
          Editing requires a connected Supabase project. See the README to connect one.
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

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">
        Edit Restaurant
      </h1>

      <RestaurantForm
        locale={locale}
        mode="edit"
        restaurantId={restaurant.id}
        initial={{
          slug: restaurant.slug,
          name: restaurant.name,
          shortDescription: restaurant.short_description,
          description: restaurant.description,
          coverImage: restaurant.cover_image,
          address: restaurant.address,
          lat: restaurant.lat,
          lng: restaurant.lng,
          phone: restaurant.phone ?? "",
          website: restaurant.website ?? "",
          cuisine: (restaurant.cuisine ?? []) as string[],
          priceRange:
            restaurant.price_range === "$$$$"
              ? "$$$"
              : restaurant.price_range,
          openingHours: restaurant.opening_hours ?? "",
          menuHighlights: Array.isArray(restaurant.menu)
            ? (restaurant.menu as unknown as {
                name: string;
                price: string;
                description?: string;
              }[])
            : [],
          reservable: restaurant.reservable,
          featured: restaurant.featured,
        }}
      />
    </section>
  );
}