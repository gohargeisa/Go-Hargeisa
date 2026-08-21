import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requirePlatformPermission } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getArticles } from "@/lib/data/articles";
import { AdminListTable } from "@/components/admin/admin-list-table";

export const metadata: Metadata = { title: "Manage Articles — Admin" };

export default async function AdminArticlesPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requirePlatformPermission(locale, `/${locale}/admin/articles`, "content_view");
  const t = await getTranslations({ locale, namespace: "admin" });

  let articles: { id: string; title: string; excerpt: string; cover_image: string; category: string; status: "draft" | "published" | "archived" }[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("articles").select("id, title, excerpt, cover_image, category, status");
    articles = data ?? [];
  } else {
    articles = (await getArticles()).map((a) => ({
      id: a.id,
      title: a.title,
      excerpt: a.excerpt,
      cover_image: a.coverImage,
      category: a.category,
      status: "published" as const,
    }));
  }

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("manageArticles")}</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{articles.length} {t("articlesPublished")}</p>
        </div>
        <Link
          href={`/${locale}/admin/articles/new`}
          className="inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors"
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
            image: a.cover_image,
            title: a.title,
            subtitle: a.excerpt,
            meta: a.category,
            status: a.status,
          }))}
        />
      </div>
    </section>
  );
}
