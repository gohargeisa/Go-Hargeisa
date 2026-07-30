import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { PageHero } from "@/components/shared/page-hero";
import { JoinRequestForm } from "@/components/shared/join-request-form";
import { placeholderImage } from "@/lib/placeholder-image";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "List Your Business — Go Hargeisa",
    description: "Apply to list your hotel, restaurant, or café on Go Hargeisa.",
    alternates: localeAlternates(locale as Locale, "/join"),
  };
}

export default async function JoinPage({ params: { locale } }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale, namespace: "joinRequest" });

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("pageTitle")} subtitle={t("pageSubtitle")} image={placeholderImage("List Your Business", { tone: "primary" })} />
      <section className="container-px mx-auto max-w-2xl py-14">
        <JoinRequestForm />
      </section>
    </>
  );
}
