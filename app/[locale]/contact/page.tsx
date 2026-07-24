import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { ContactForm } from "@/components/shared/contact-form";
import { placeholderImage } from "@/lib/placeholder-image";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Contact Go Hargeisa",
  description: "Get in touch with the Go Hargeisa team.",
    alternates: { canonical: `/${locale}/contact` },
  };
}

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get in Touch"
        title="Contact Us"
        image={placeholderImage("Contact Go Hargeisa", { tone: "secondary" })}
      />
      <section className="container-px mx-auto grid gap-10 py-14 lg:grid-cols-3">
        <div className="space-y-6">
          <ContactRow icon={Mail} label="Email" value="info@gohargeisa.com" />
          <ContactRow icon={Phone} label="Phone" value="+252 65 6156 752" />
          <ContactRow icon={MapPin} label="Office" value="Maroodi Jeex, Hargeisa, Somaliland" />
        </div>
        <div className="lg:col-span-2">
          <ContactForm />
        </div>
      </section>
    </>
  );
}

function ContactRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon size={17} />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
