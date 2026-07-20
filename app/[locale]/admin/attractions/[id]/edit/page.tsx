import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { AttractionForm } from "@/components/admin/attraction-form";

export const metadata: Metadata = { title: "Edit Attraction — Admin" };

export default async function EditAttractionPage({
  params: { locale, id },
}: {
  params: { locale: Locale; id: string };
}) {
  await requireAdmin(locale, `/${locale}/admin/attractions/${id}/edit`);

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
    .from("attractions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const attraction = data as unknown as Database["public"]["Tables"]["attractions"]["Row"];

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">Edit Attraction</h1>
      <AttractionForm
        locale={locale}
        mode="edit"
        attractionId={attraction.id}
        initial={{
          slug: attraction.slug,
          name: attraction.name,
          shortDescription: attraction.short_description,
          description: attraction.description,
          coverImage: attraction.cover_image,
          address: attraction.address,
          lat: attraction.lat,
          lng: attraction.lng,
          history: attraction.history ?? "",
          bestTimeToVisit: attraction.best_time_to_visit ?? "",
          entryFee: attraction.entry_fee,
          visitorTips: attraction.visitor_tips ?? [],
          category: attraction.category,
          featured: attraction.featured,
        }}
      />
    </section>
  );
}
