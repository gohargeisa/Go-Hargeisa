import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { CityServiceForm } from "@/components/admin/city-service-form";

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

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">{t("editCityServiceTitle")}</h1>
      <CityServiceForm
        locale={locale}
        mode="edit"
        serviceId={service.id}
        initial={{
          category: service.category,
          name: service.name,
          phone: service.phone ?? "",
          openingHours: service.opening_hours ?? "",
          mapsUrl: service.maps_url ?? "",
          image: service.image ?? "",
        }}
      />
    </section>
  );
}
