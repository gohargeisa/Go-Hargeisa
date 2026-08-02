import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { ServiceForm } from "@/components/admin/service-form";

export const metadata: Metadata = { title: "Add Service — Admin" };

export default async function NewServicePage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/services/new`);
  const t = await getTranslations({ locale, namespace: "admin" });

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">{t("addServiceTitle")}</h1>
      <ServiceForm locale={locale} mode="create" />
    </section>
  );
}
