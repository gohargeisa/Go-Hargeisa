import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { CafeForm } from "@/components/admin/cafe-form";

export const metadata: Metadata = { title: "Edit Cafe — Admin" };

export default async function EditCafePage({
  params: { locale, id },
}: {
  params: { locale: Locale; id: string };
}) {
  await requireAdmin(locale, `/${locale}/admin/cafes/${id}/edit`);

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
    .from("cafes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const cafe = data as unknown as Database["public"]["Tables"]["cafes"]["Row"];

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">Edit Cafe</h1>
      <CafeForm
        locale={locale}
        mode="edit"
        cafeId={cafe.id}
        initial={{
          slug: cafe.slug,
          name: cafe.name,
          shortDescription: cafe.short_description,
          description: cafe.description,
          coverImage: cafe.cover_image,
          address: cafe.address,
          lat: cafe.lat,
          lng: cafe.lng,
          phone: cafe.phone ?? "",
          specialDrinks: cafe.special_drinks ?? [],
          wifi: cafe.wifi,
          workingSpace: cafe.working_space,
          openingHours: cafe.opening_hours ?? "",
          featured: cafe.featured,
        }}
      />
    </section>
  );
}
