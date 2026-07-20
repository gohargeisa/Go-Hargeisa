import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Article } from "@/types/index";
import type { Locale } from "@/lib/i18n/config";
import { SectionHeader } from "@/components/shared/section-header";

export function ArticlesSection({ articles, locale }: { articles: Article[]; locale: Locale }) {
  const t = useTranslations("home");
  const common = useTranslations("common");

  return (
    <section className="bg-white dark:bg-white/[0.03] py-16 md:py-20">
      <div className="container-px mx-auto">
        <SectionHeader
          eyebrow="The Journal"
          title={t("articlesTitle")}
          viewAllHref={`/${locale}/blog`}
          viewAllLabel={t("viewAll")}
        />
        <div className="grid gap-6 md:grid-cols-3">
          {articles.map((a) => (
            <Link key={a.id} href={`/${locale}/blog/${a.slug}`} className="group block">
              <div className="relative h-52 w-full overflow-hidden rounded-xl2">
                <Image
                  src={a.coverImage}
                  alt={a.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-wide text-secondary">
                {a.category}
              </span>
              <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
                {a.title}
              </h3>
              <p className="mt-1.5 text-sm text-ink/60 dark:text-sand/60 line-clamp-2">{a.excerpt}</p>
              <p className="mt-2 text-xs font-medium text-ink/45 dark:text-sand/45">
                {a.readMinutes} min read · {common("readMore")}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
