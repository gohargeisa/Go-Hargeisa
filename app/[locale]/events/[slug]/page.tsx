import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Ticket } from "lucide-react";
import { getEventBySlug, getAllEventSlugs } from "@/lib/data/events";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllEventSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const e = await getEventBySlug(slug);

  if (!e) return {};

  return {
    title: `${e.title} — Hargeisa Events`,
    description: e.description,
    alternates: {
      canonical: `/${locale}/events/${e.slug}`,
    },
  };
}

export default async function EventDetailPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  return (
    <article className="container-px mx-auto max-w-3xl py-14">
      <div className="relative h-72 md:h-96 w-full overflow-hidden rounded-xl3">
        <Image
          src={event.coverImage}
          alt={event.title}
          fill
          priority
          className="object-cover"
        />
      </div>

      <span className="mt-6 inline-block text-xs font-semibold uppercase tracking-wide text-secondary">
        {event.category}
      </span>

      <h1 className="mt-2 font-display text-3xl md:text-4xl font-semibold">
        {event.title}
      </h1>

      <div className="mt-4 flex flex-wrap gap-5 text-sm text-ink/60 dark:text-sand/60">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={15} />

          {new Date(event.startDate).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}

          {event.endDate &&
            event.endDate !== event.startDate &&
            ` – ${new Date(event.endDate).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
            })}`}
        </span>

        <span className="flex items-center gap-1.5">
          <MapPin size={15} /> {event.location}
        </span>
      </div>

      <p className="mt-6 leading-relaxed text-ink/75 dark:text-sand/75">
        {event.description}
      </p>

      {event.ticketInfo && (
        <div className="mt-8 flex items-center gap-2 rounded-xl2 border border-ink/8 dark:border-white/10 p-4 text-sm">
          <Ticket size={16} className="text-primary" />
          {event.ticketInfo}
        </div>
      )}
    </article>
  );
}