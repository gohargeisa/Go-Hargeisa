import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CalendarDays, MapPin } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getEvents } from "@/lib/data/events";
import { PageHero } from "@/components/shared/page-hero";
import { placeholderImage } from "@/lib/placeholder-image";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Events in Hargeisa — Festivals, Conferences & More",
  description: "Upcoming cultural festivals, national events, conferences, sports and concerts in Hargeisa.",
    alternates: { canonical: `/${locale}/events` },
  };
}

const categories = ["all", "cultural", "national", "business", "sports", "concert"] as const;

export default async function EventsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { category?: string };
}) {
  const t = await getTranslations("home");
  const active = searchParams.category ?? "all";
  const filtered = await getEvents({ category: active });

  return (
    <>
      <PageHero
        eyebrow="Calendar"
        title={t("eventsTitle")}
        image={placeholderImage("Events in Hargeisa", { tone: "primary" })}
      />
      <section className="container-px mx-auto py-14">
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c}
              href={`/${locale}/events${c === "all" ? "" : `?category=${c}`}`}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                active === c
                  ? "bg-primary text-white"
                  : "border border-ink/15 dark:border-white/20 text-ink/70 dark:text-sand/70 hover:border-primary hover:text-primary"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((e) => (
            <Link
              key={e.id}
              href={`/${locale}/events/${e.slug}`}
              className="group flex flex-col sm:flex-row gap-5 rounded-xl2 border border-ink/8 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-card"
            >
              <div className="relative h-40 sm:h-auto sm:w-56 shrink-0 overflow-hidden rounded-xl">
                <Image src={e.coverImage} alt={e.title} fill className="object-cover" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary">{e.category}</span>
                <h2 className="mt-1 font-display text-xl font-semibold group-hover:text-primary transition-colors">
                  {e.title}
                </h2>
                <p className="mt-2 text-sm text-ink/65 dark:text-sand/65">{e.description}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-ink/50 dark:text-sand/50">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={13} />
                    {new Date(e.startDate).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} /> {e.location}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && <p className="text-ink/50">No events in this category yet.</p>}
        </div>
      </section>
    </>
  );
}
