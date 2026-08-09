import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { CityServiceForm } from "@/components/admin/city-service-form";
import { getCityServiceCategories } from "@/lib/data/categories";

export const metadata: Metadata = { title: "Add City Service — Admin" };

export default async function NewCityServicePage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/city-services/new`);
  const t = await getTranslations({ locale, namespace: "admin" });
  const categories = await getCityServiceCategories();

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">{t("addCityServiceTitle")}</h1>
      <CityServiceForm locale={locale} mode="create" categories={categories} canAssignOwner />
    </section>
  );
}
