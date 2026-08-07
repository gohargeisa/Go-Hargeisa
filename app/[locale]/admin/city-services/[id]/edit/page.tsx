import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { CityServiceForm } from "@/components/admin/city-service-form";
import { getCityServiceCategories } from "@/lib/data/categories";
import type { OpeningHoursGroup } from "@/types";

export const metadata: Metadata = { title: "Edit City Service — Admin" };

export default async function EditCityServicePage({
  params: { locale, id },
}: {
  params: { locale: Locale; id: string };
}) {
  await requireAdmin(locale, `/${locale}/admin/city-services/${id}/edit`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const supabase = await createClient();
  const { data, error } = await supabase.from("city_services").select("*").eq("id", id).single();

  if (error || !data) notFound();

  const service = data as unknown as Database["public"]["Tables"]["city_services"]["Row"];
  const categories = await getCityServiceCategories();

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">{t("editCityServiceTitle")}</h1>
      <CityServiceForm
        locale={locale}
        mode="edit"
        serviceId={service.id}
        categories={categories}
        initial={{
          categoryId: service.category_id,
          name: service.name,
          nameAr: service.name_ar ?? "",
          nameSo: service.name_so ?? "",
          description: service.description ?? "",
          descriptionAr: service.description_ar ?? "",
          descriptionSo: service.description_so ?? "",
          phone: service.phone ?? "",
          whatsapp: service.whatsapp ?? "",
          email: service.email ?? "",
          openingHours: service.opening_hours ?? "",
          mapsUrl: service.maps_url ?? "",
          website: service.website ?? "",
          image: service.image ?? "",
          gallery: Array.isArray(service.gallery) ? (service.gallery as unknown as { url: string; alt?: string; category?: string }[]) : [],
          videos: Array.isArray(service.videos) ? (service.videos as unknown as { url: string; caption?: string }[]) : [],
          lat: service.lat,
          lng: service.lng,
          amenitiesV2: service.amenities_v2 ?? [],
          openingHoursStructured: Array.isArray(service.opening_hours_structured)
            ? (service.opening_hours_structured as unknown as OpeningHoursGroup[])
            : [],
          is24Hours: service.is_24_hours,
          temporarilyClosed: service.temporarily_closed,
          permanentlyClosed: service.permanently_closed,
          socialInstagram: service.social_instagram ?? "",
          socialFacebook: service.social_facebook ?? "",
          socialTiktok: service.social_tiktok ?? "",
          socialSnapchat: service.social_snapchat ?? "",
          socialX: service.social_x ?? "",
          socialYoutube: service.social_youtube ?? "",
          socialTelegram: service.social_telegram ?? "",
          status: service.status === "archived" ? "draft" : service.status,
          featured: service.featured,
        }}
      />
    </section>
  );
}
