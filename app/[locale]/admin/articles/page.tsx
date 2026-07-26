import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getArticles } from "@/lib/data/articles";
import { AdminListTable } from "@/components/admin/admin-list-table";

export const metadata: Metadata = { title: "Manage Articles — Admin" };

export default async function AdminArticlesPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/articles`);
  const t = await getTranslations({ locale, namespace: "admin" });
  const articles = await getArticles();

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("manageArticles")}</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{articles.length} {t("articlesPublished")}</p>
        </div>
        <Link
          href={`/${locale}/admin/articles/new`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} /> {t("addArticle")}
        </Link>
      </div>

      <div className="mt-8">
        <AdminListTable
          table="articles"
          metaLabel={t("categoryMetaLabel")}
          editHrefBase={`/${locale}/admin/articles`}
          emptyLabel={t("noArticlesYet")}
          rows={articles.map((a) => ({
            id: a.id,
            image: a.coverImage,
            title: a.title,
            subtitle: a.author,
            meta: a.category,
          }))}
        />
      </div>
    </section>
  );
}
