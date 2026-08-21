import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Newspaper } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getArticles } from "@/lib/data/articles";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/home/reveal";

/** Reuses the shared hero photo — same swap-in-place pattern as attractions-hero.tsx / about-hero.tsx. */
const BLOG_HERO_IMAGE = "/images/hero-bg.png";

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
    title: "Hargeisa, At Your Fingertips",
  description: "Discover what's new in Hargeisa — places, services, events and stories from a smarter city.",
    alternates: localeAlternates(locale as Locale, "/blog"),
  };
}

export default async function BlogPage({ params: { locale } }: { params: { locale: string } }) {
  const articles = await getArticles();
  const t = await getTranslations({ locale, namespace: "blog" });

  return (
    <>
      <PremiumPageHero
        image={BLOG_HERO_IMAGE}
        imageAlt="Panoramic view of Hargeisa"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        scrollHint={t("scrollHint")}
      />
      <section className="container-px mx-auto py-16 md:py-24">
        {articles.length === 0 ? (
          <EmptyState icon={Newspaper} title={t("emptyStateTitle")} description={t("emptyState")} />
        ) : (
          <Reveal>
            <div className="grid gap-8 md:grid-cols-3">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  href={`/${locale}/blog/${a.slug}`}
                  className="group block overflow-hidden rounded-xl3 border border-ink/8 bg-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1.5 hover:shadow-card dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="relative h-52 w-full overflow-hidden">
                    <Image
                      src={a.coverImage}
                      alt={a.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <span className="inline-block text-xs font-semibold uppercase tracking-wide text-secondary">
                      {a.category}
                    </span>
                    <h2 className="mt-1.5 font-display text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
                      {a.title}
                    </h2>
                    <p className="mt-1.5 line-clamp-2 text-sm text-ink/60 dark:text-sand/60">{a.excerpt}</p>
                    <p className="mt-3 border-t border-ink/8 pt-3 text-xs font-medium text-ink/70 dark:border-white/10 dark:text-sand/70">
                      {a.author} · {t("minRead", { minutes: a.readMinutes })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        )}
      </section>
    </>
  );
}
