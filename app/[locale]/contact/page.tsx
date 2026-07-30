import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Mail, Phone, MapPin } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { PageHero } from "@/components/shared/page-hero";
import { ContactForm } from "@/components/shared/contact-form";
import { Reveal } from "@/components/home/reveal";
import { placeholderImage } from "@/lib/placeholder-image";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Contact Go Hargeisa",
  description: "Get in touch with the Go Hargeisa team.",
    alternates: localeAlternates(locale as Locale, "/contact"),
  };
}

export default async function ContactPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        image={placeholderImage("Contact Go Hargeisa", { tone: "secondary" })}
      />
      <section className="container-px mx-auto grid gap-8 py-10 md:py-14 lg:grid-cols-3 lg:gap-10">
        <Reveal>
          <div className="space-y-4 rounded-xl3 border border-ink/8 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
            <ContactRow icon={Mail} label={t("emailLabel")} value="info@gohargeisa.com" />
            <ContactRow icon={Phone} label={t("phoneLabel")} value="+252 65 6156 752" />
            <ContactRow icon={MapPin} label={t("officeLabel")} value={t("officeValue")} />
          </div>
        </Reveal>
        <Reveal delay={0.08} className="lg:col-span-2">
          <ContactForm />
        </Reveal>
      </section>
    </>
  );
}

function ContactRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
