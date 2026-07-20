import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getArticleBySlug, getAllArticleSlugs } from "@/lib/data/articles";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const a = await getArticleBySlug(slug);

  if (!a) return {};

  return {
    title: a.title,
    description: a.excerpt,
    openGraph: {
      images: [a.coverImage],
      type: "article",
    },
    alternates: {
      canonical: `/${locale}/blog/${a.slug}`,
    },
  };
}

export default async function ArticleDetailPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  // `body` is stored as plain Markdown in Supabase (see supabase/schema.sql).
  // Rendered here as paragraphs; swap in `react-markdown` if you want full
  // Markdown syntax (headings, lists, links) rendered from the CMS.
  const paragraphs = article.body.split(/\n{2,}/).filter(Boolean);

  return (
    <article className="container-px mx-auto max-w-3xl py-14">
      <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
        {article.category}
      </span>

      <h1 className="mt-2 font-display text-3xl md:text-4xl font-semibold text-balance">
        {article.title}
      </h1>

      <p className="mt-3 text-sm text-ink/50 dark:text-sand/50">
        {article.author} ·{" "}
        {new Date(article.publishedAt).toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}{" "}
        · {article.readMinutes} min read
      </p>

      <div className="relative mt-8 h-72 md:h-96 w-full overflow-hidden rounded-xl3">
        <Image
          src={article.coverImage}
          alt={article.title}
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none">
        {(paragraphs as string[]).map((p: string, i: number) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}