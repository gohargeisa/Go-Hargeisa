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
    title: "Privacy Policy — Go Hargeisa",
    alternates: localeAlternates(locale as Locale, "/privacy"),
  };
}

export default async function PrivacyPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: "privacy" });
  const tFooter = await getTranslations({ locale, namespace: "footer" });

  return (
    <>
      <PageHero eyebrow={tFooter("legal")} title={t("title")} subtitle={t("lastUpdated")} image={placeholderImage("Privacy Policy", { tone: "ink" })} />
      <section className="container-px mx-auto max-w-3xl py-10 md:py-14">
        <Reveal>
          <div className="prose prose-neutral dark:prose-invert">
            <p>{t("intro")}</p>
            <h2>{t("infoTitle")}</h2>
            <ul>
              <li>{t("infoItem1")}</li>
              <li>{t("infoItem2")}</li>
              <li>{t("infoItem3")}</li>
              <li>{t("infoItem4")}</li>
            </ul>
            <h2>{t("useTitle")}</h2>
            <p>{t("useText")}</p>
            <h2>{t("contactTitle")}</h2>
            <p>{t("contactText")}</p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
