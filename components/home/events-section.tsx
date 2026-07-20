import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useFormatter } from "next-intl";
import type { EventItem } from "@/types";
import type { Locale } from "@/lib/i18n/config";
import { SectionHeader } from "@/components/shared/section-header";

export function EventsSection({ events, locale }: { events: EventItem[]; locale: Locale }) {
  const t = useTranslations("home");
  const format = useFormatter();

  return (
    <section className="container-px mx-auto py-16 md:py-20">
      <SectionHeader
        eyebrow="Calendar"
        title={t("eventsTitle")}
        viewAllHref={`/${locale}/events`}
        viewAllLabel={t("viewAll")}
      />
      <div className="grid gap-5 md:grid-cols-2">
        {events.map((e) => {
          const date = new Date(e.startDate);
          return (
            <Link
              key={e.id}
              href={`/${locale}/events/${e.slug}`}
              className="group flex gap-4 rounded-xl2 border border-ink/8 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-card hover:-translate-y-0.5 transition-transform"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                <Image src={e.coverImage} alt={e.title} fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
                  {e.category}
                </span>
                <h3 className="mt-1 font-display text-base font-semibold leading-snug line-clamp-1">
                  {e.title}
                </h3>
                <p className="mt-1 text-sm text-ink/60 dark:text-sand/60 line-clamp-2">
                  {e.description}
                </p>
                <p className="mt-2 text-xs font-medium text-ink/50 dark:text-sand/50">
                  {format.dateTime(date, { month: "short", day: "numeric", year: "numeric" })} · {e.location}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
