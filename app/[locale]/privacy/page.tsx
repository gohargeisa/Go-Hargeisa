import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";

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

  return (
    <section className="container-px mx-auto max-w-3xl py-14 prose prose-neutral dark:prose-invert">
      <h1>{t("title")}</h1>
      <p>{t("lastUpdated")}</p>
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
    </section>
  );
}
