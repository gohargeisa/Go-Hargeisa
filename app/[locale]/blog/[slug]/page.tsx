import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getArticleBySlug, getAllArticleSlugs } from "@/lib/data/articles";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { Reveal } from "@/components/home/reveal";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";

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
    alternates: localeAlternates(locale as Locale, `/blog/${a.slug}`),
  };
}

export default async function ArticleDetailPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const tNav = await getTranslations("nav");
  const tBlog = await getTranslations("blog");

  // `body` is stored as plain Markdown in Supabase (see supabase/schema.sql).
  // Rendered here as paragraphs; swap in `react-markdown` if you want full
  // Markdown syntax (headings, lists, links) rendered from the CMS.
  const paragraphs = article.body.split(/\n{2,}/).filter(Boolean);

  const publishedDate = new Date(article.publishedAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const meta = `${article.author} · ${publishedDate} · ${tBlog("minRead", { minutes: article.readMinutes })}`;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: tNav("blog"), href: `/${locale}/blog` },
          { label: article.title, href: `/${locale}/blog/${article.slug}` },
        ]}
      />

      <PremiumPageHero
        image={article.coverImage}
        imageAlt={article.title}
        eyebrow={article.category}
        title={article.title}
        subtitle={meta}
        scrollHint={tBlog("scrollHint")}
      />

      <article className="container-px mx-auto max-w-3xl py-16 md:py-24">
        <Reveal>
          <div className="prose prose-neutral dark:prose-invert prose-lg max-w-none">
            {(paragraphs as string[]).map((p: string, i: number) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Reveal>
      </article>
    </>
  );
}