import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { ArticleForm } from "@/components/admin/article-form";

export const metadata: Metadata = { title: "Add Article — Admin" };

export default async function NewArticlePage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/articles/new`);

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">Add Article</h1>
      <ArticleForm locale={locale} mode="create" />
    </section>
  );
}
