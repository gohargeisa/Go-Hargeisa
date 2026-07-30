import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/home/reveal";
import { placeholderImage } from "@/lib/placeholder-image";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "About Go Hargeisa",
  description: "Go Hargeisa is an independent guide to the capital of Somaliland, built for travelers, business visitors and the diaspora.",
    alternates: localeAlternates(locale as Locale, "/about"),
  };
}

export default async function AboutPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: "about" });

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        image={placeholderImage("About Go Hargeisa", { tone: "primary" })}
      />
      <section className="container-px mx-auto max-w-3xl py-10 md:py-14">
        <Reveal>
          <div className="prose prose-neutral dark:prose-invert">
            <p>{t("paragraph1")}</p>
            <p>{t("paragraph2")}</p>
            <p>
              {t.rich("paragraph3", {
                link: (chunks) => <a href={`/${locale}/contact`}>{chunks}</a>,
              })}
            </p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
