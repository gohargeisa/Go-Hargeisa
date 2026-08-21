import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { RestaurantForm } from "@/components/admin/restaurant-form";

export const metadata: Metadata = { title: "Add Restaurant — Admin" };

export default async function NewRestaurantPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/restaurants/new`);
  const t = await getTranslations({ locale, namespace: "admin" });

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">{t("addRestaurantTitle")}</h1>
      <RestaurantForm locale={locale} mode="create" canAssignOwner />
    </section>
  );
}
