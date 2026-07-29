import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { CityServicesList } from "@/components/admin/city-services-list";

export const metadata: Metadata = { title: "Manage City Services — Admin" };

export default async function AdminCityServicesPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/city-services`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const supabase = await createClient();
  const { data } = await supabase
    .from("city_services")
    .select("id, name, image, category, status")
    .order("category")
    .order("sort_order");

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("manageCityServices")}</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{(data ?? []).length}</p>
        </div>
        <Link
          href={`/${locale}/admin/city-services/new`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} /> {t("addCityService")}
        </Link>
      </div>

      <div className="mt-8">
        <CityServicesList locale={locale} rows={data ?? []} />
      </div>
    </section>
  );
}
