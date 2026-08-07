import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { CityServicesList } from "@/components/admin/city-services-list";
import { getCategoriesForAdmin } from "@/lib/data/categories";
import { categoryDisplayName } from "@/lib/utils/category-href";

export const metadata: Metadata = { title: "Manage City Services — Admin" };

export default async function AdminCityServicesPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/city-services`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const supabase = await createClient();
  const [{ data }, allCategories] = await Promise.all([
    supabase.from("city_services").select("id, name, image, category_id, status, featured").order("category_id").order("sort_order"),
    getCategoriesForAdmin(),
  ]);
  const categoryById = new Map(allCategories.map((c) => [c.id, c]));
  const rows = (data ?? []).map((row) => {
    const category = categoryById.get(row.category_id);
    return {
      id: row.id,
      name: row.name,
      image: row.image,
      categoryName: category ? categoryDisplayName(category, locale) : "—",
      status: row.status,
      featured: row.featured,
    };
  });

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("manageCityServices")}</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{rows.length}</p>
        </div>
        <Link
          href={`/${locale}/admin/city-services/new`}
          className="inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors"
        >
          <Plus size={16} /> {t("addCityService")}
        </Link>
      </div>

      <div className="mt-8">
        <CityServicesList locale={locale} rows={rows} />
      </div>
    </section>
  );
}
