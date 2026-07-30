import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Plane, Car, Bus, ParkingCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { PageHero } from "@/components/shared/page-hero";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Getting Around Hargeisa — Transportation Guide",
  description: "How to get to and around Hargeisa: airport transfers, taxis, car rental and shared transport.",
    alternates: localeAlternates(locale as Locale, "/transportation"),
  };
}

export default async function TransportationPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: "transportation" });

  const options = [
    { icon: Plane, title: t("airportTransfersTitle"), body: t("airportTransfersBody") },
    { icon: Car, title: t("taxisTitle"), body: t("taxisBody") },
    { icon: Bus, title: t("minibusesTitle"), body: t("minibusesBody") },
    { icon: ParkingCircle, title: t("rentalTitle"), body: t("rentalBody") },
  ];

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        image="https://images.unsplash.com/photo-1691724414154-8b1551e7b292?fm=jpg&q=80&w=2400&auto=format&fit=crop"
      />
      <section className="container-px mx-auto py-14 grid gap-5 sm:grid-cols-2">
        {options.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon size={20} />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold">{title}</h2>
            <p className="mt-1.5 text-sm text-ink/65 dark:text-sand/65 leading-relaxed">{body}</p>
          </div>
        ))}
      </section>
    </>
  );
}
