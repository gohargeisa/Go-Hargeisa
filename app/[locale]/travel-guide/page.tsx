import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Stamp, Plane, Bus, Coins, ShieldAlert, PhoneCall, Wifi,
  Users, Sun, Backpack, HelpCircle,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { PageHero } from "@/components/shared/page-hero";
import { placeholderImage } from "@/lib/placeholder-image";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Hargeisa Travel Guide — Visa, Safety, Transport & More",
  description: "Everything you need to know before visiting Hargeisa: visa requirements, airport guide, currency, safety tips and more.",
    alternates: { canonical: `/${locale}/travel-guide` },
  };
}

export default async function TravelGuidePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: "travelGuide" });

  const sections = [
    { icon: Stamp, title: t("visaTitle"), body: t("visaBody") },
    { icon: Plane, title: t("airportTitle"), body: t("airportBody") },
    { icon: Bus, title: t("transportTitle"), body: t("transportBody") },
    { icon: Coins, title: t("currencyTitle"), body: t("currencyBody") },
    { icon: ShieldAlert, title: t("safetyTitle"), body: t("safetyBody") },
    { icon: PhoneCall, title: t("emergencyTitle"), body: t("emergencyBody") },
    { icon: Wifi, title: t("internetTitle"), body: t("internetBody") },
    { icon: Users, title: t("customsTitle"), body: t("customsBody") },
    { icon: Sun, title: t("bestTimeTitle"), body: t("bestTimeBody") },
    { icon: Backpack, title: t("packingTitle"), body: t("packingBody") },
  ];

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
  ];

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        image={placeholderImage("Hargeisa Travel Guide", { tone: "secondary" })}
      />
      <section className="container-px mx-auto py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon size={20} />
              </span>
              <h2 className="mt-4 font-display text-base font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm text-ink/65 dark:text-sand/65 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold mb-6">
            <HelpCircle size={22} className="text-secondary" /> {t("faqTitle")}
          </h2>
          <div className="divide-y divide-ink/8 dark:divide-white/10 rounded-xl2 border border-ink/8 dark:border-white/10">
            {faqs.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold text-sm marker:content-none">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm text-ink/65 dark:text-sand/65">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
