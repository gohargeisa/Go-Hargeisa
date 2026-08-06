import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getServiceCategories } from "@/lib/data/categories";
import { ServiceForm } from "@/components/admin/service-form";
import type { MediaVideo } from "@/types";

export const metadata: Metadata = { title: "Edit Service — Admin" };

export default async function EditServicePage({
  params: { locale, id },
}: {
  params: { locale: Locale; id: string };
}) {
  await requireAdmin(locale, `/${locale}/admin/services/${id}/edit`);
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
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const service = data as unknown as Database["public"]["Tables"]["services"]["Row"];
  const categories = await getServiceCategories();

  const gallery = Array.isArray(service.gallery)
    ? (service.gallery as unknown as { url: string; alt?: string; category?: string }[])
    : [];

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">{t("editServiceTitle")}</h1>
      <ServiceForm
        locale={locale}
        mode="edit"
        serviceId={service.id}
        categories={categories}
        initial={{
          slug: service.slug,
          name: service.name,
          shortDescription: service.short_description,
          description: service.description,
          coverImage: service.cover_image,
          logo: service.logo_url ?? "",
          gallery: gallery as any,
          videos: Array.isArray(service.videos) ? (service.videos as unknown as MediaVideo[]) : [],
          address: service.address,
          lat: service.lat,
          lng: service.lng,
          googleMapsUrl: service.google_maps_url ?? "",
          phone: service.phone ?? "",
          whatsapp: service.whatsapp ?? "",
          email: service.email ?? "",
          website: service.website ?? "",
          socialInstagram: service.social_instagram ?? "",
          socialFacebook: service.social_facebook ?? "",
          openingHours: service.opening_hours ?? "",
          openingHoursStructured: Array.isArray(service.opening_hours_structured)
            ? (service.opening_hours_structured as never)
            : [],
          services: service.services ?? [],
          categoryId: service.category_id ?? categories[0]?.id ?? "",
          featured: service.featured,
        }}
      />
    </section>
  );
}
