import { useTranslations } from "next-intl";
import { Coffee, Camera, Users, UtensilsCrossed } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";

const experiences = [
  { icon: UtensilsCrossed, title: "Somali Cooking Class", desc: "Learn to make bariis and sabaayad with a local family." },
  { icon: Camera, title: "Old Town Photo Walk", desc: "A guided walking tour through Hargeisa's historic quarters." },
  { icon: Coffee, title: "Coffee Ceremony", desc: "Traditional Somali coffee ceremony in a family home." },
  { icon: Users, title: "Market Day with a Local", desc: "Navigate Waheen Market like a local, guided by a resident." },
];

export function ExperiencesSection() {
  const t = useTranslations("home");

  return (
    <section className="bg-white dark:bg-white/[0.03] py-16 md:py-20">
      <div className="container-px mx-auto">
        <SectionHeader eyebrow="Do as locals do" title={t("experiencesTitle")} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {experiences.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6 hover:border-primary/40 transition-colors"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-ink/60 dark:text-sand/60">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
