import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/home/reveal";
import { categoryDisplayName } from "@/lib/utils/category-href";
import type { Category } from "@/types";

/** "Who Can Join" — every category shown here is a real, currently-supported
 * row from the categories table (the exact same list the form's own
 * dropdowns use), never a hardcoded/aspirational vertical list. */
export async function WhoCanJoinSection({ locale, categories }: { locale: Locale; categories: Category[] }) {
  const t = await getTranslations({ locale, namespace: "joinRequest" });

  return (
    <section className="container-px mx-auto py-16 sm:py-20">
      <Reveal>
        <h2 className="text-balance text-center font-display text-2xl font-bold sm:text-3xl">{t("whoCanJoinTitle")}</h2>
        <p className="mx-auto mt-3 max-w-xl text-balance text-center text-ink/60 dark:text-sand/60">
          {t("whoCanJoinSubtitle")}
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {categories.map((c) => (
            <span
              key={c.id}
              className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-medium text-ink/75 dark:border-white/10 dark:bg-white/[0.03] dark:text-sand/75"
            >
              {categoryDisplayName(c, locale)}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
