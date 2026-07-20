import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import type { Destination } from "@/types";
import type { Locale } from "@/lib/i18n/config";
import { SectionHeader } from "@/components/shared/section-header";

export function DestinationsSection({
  destinations,
  locale,
}: {
  destinations: Destination[];
  locale: Locale;
}) {
  const t = useTranslations("home");

  return (
    <section className="container-px mx-auto py-16 md:py-20">
      <SectionHeader
        eyebrow="Neighborhoods"
        title={t("destinationsTitle")}
        subtitle={t("destinationsSubtitle")}
      />
      <div className="grid gap-5 md:grid-cols-3">
        {destinations.map((d) => (
          <Link
            key={d.id}
            href={`/${locale}/explore/${d.slug}`}
            className="group relative h-80 overflow-hidden rounded-xl3"
          >
            <Image
              src={d.image}
              alt={d.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                {d.placeCount} places
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold">{d.name}</h3>
              <p className="mt-1 text-sm text-white/80 line-clamp-2">{d.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">
                Explore <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
