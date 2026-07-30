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
    title: "Terms of Service — Go Hargeisa",
    alternates: localeAlternates(locale as Locale, "/terms"),
  };
}

export default async function TermsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: "terms" });
  const tFooter = await getTranslations({ locale, namespace: "footer" });

  return (
    <>
      <PageHero eyebrow={tFooter("legal")} title={t("title")} subtitle={t("lastUpdated")} image={placeholderImage("Terms of Service", { tone: "ink" })} />
      <section className="container-px mx-auto max-w-3xl py-10 md:py-14">
        <Reveal>
          <div className="prose prose-neutral dark:prose-invert">
            <p>{t("intro")}</p>
            <h2>{t("useOfContentTitle")}</h2>
            <p>{t("useOfContentText")}</p>
            <h2>{t("userAccountsTitle")}</h2>
            <p>{t("userAccountsText")}</p>
            <h2>{t("liabilityTitle")}</h2>
            <p>{t("liabilityText")}</p>
            <h2>{t("contactTitle")}</h2>
            <p>{t("contactText")}</p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
