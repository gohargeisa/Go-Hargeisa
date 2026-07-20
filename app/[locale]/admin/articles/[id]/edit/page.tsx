import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { ArticleForm } from "@/components/admin/article-form";

export const metadata: Metadata = { title: "Edit Article — Admin" };

export default async function EditArticlePage({
  params: { locale, id },
}: {
  params: { locale: Locale; id: string };
}) {
  await requireAdmin(locale, `/${locale}/admin/articles/${id}/edit`);

  if (!isSupabaseConfigured()) {
    return (
      <section className="container-px mx-auto py-14">
        <p className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6 text-sm text-ink/60 dark:text-sand/60">
          Editing requires a connected Supabase project. See the README to connect one.
        </p>
      </section>
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const article = data as unknown as Database["public"]["Tables"]["articles"]["Row"];

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">
        Edit Article
      </h1>

      <ArticleForm
        locale={locale}
        mode="edit"
        articleId={article.id}
        initial={{
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          body: article.body,
          coverImage: article.cover_image,
          category: article.category,
          readMinutes: article.read_minutes,
        }}
      />
    </section>
  );
}