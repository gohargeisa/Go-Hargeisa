import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireOwner } from "@/lib/supabase/guards";
import { getCategoriesForAdmin, attachBusinessCounts } from "@/lib/data/categories";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const metadata: Metadata = { title: "Categories — Admin", robots: { index: false, follow: false } };

export default async function AdminCategoriesPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireOwner(locale, `/${locale}/admin/categories`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const categories = await attachBusinessCounts(await getCategoriesForAdmin());

  return (
    <section className="container-px mx-auto py-14">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("categoriesPageTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("categoriesPageSubtitle")}</p>
      </div>

      <div className="mt-8">
        <CategoriesManager locale={locale} categories={categories} />
      </div>
    </section>
  );
}
