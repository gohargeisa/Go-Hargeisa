import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getArticles } from "@/lib/data/articles";
import { PageHero } from "@/components/shared/page-hero";
import { placeholderImage } from "@/lib/placeholder-image";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Hargeisa Travel Blog",
  description: "Guides, food, culture and travel tips for visiting Hargeisa, Somaliland.",
    alternates: { canonical: `/${locale}/blog` },
  };
}

export default async function BlogPage({ params: { locale } }: { params: { locale: string } }) {
  const articles = await getArticles();

  return (
    <>
      <PageHero
        eyebrow="The Journal"
        title="Hargeisa Travel Blog"
        subtitle="Stories, guides and tips from people who know the city."
        image={placeholderImage("Go Hargeisa Journal", { tone: "accent" })}
      />
      <section className="container-px mx-auto py-14">
        {articles.length === 0 ? (
          <p className="text-center text-ink/50 dark:text-sand/50">No articles published yet.</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.id} href={`/${locale}/blog/${a.slug}`} className="group block">
                <div className="relative h-52 w-full overflow-hidden rounded-xl2">
                  <Image src={a.coverImage} alt={a.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-wide text-secondary">
                  {a.category}
                </span>
                <h2 className="mt-1.5 font-display text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
                  {a.title}
                </h2>
                <p className="mt-1.5 text-sm text-ink/60 dark:text-sand/60 line-clamp-2">{a.excerpt}</p>
                <p className="mt-2 text-xs font-medium text-ink/45 dark:text-sand/45">
                  {a.author} · {a.readMinutes} min read
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
