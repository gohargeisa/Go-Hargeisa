import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock, Coffee } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Cafe } from "@/types";

/** Shown only when a hotel links to an existing cafe listing (hotel.cafe, set from cafe_id in the admin form). */
export function HotelOnsiteCafeCard({
  cafe,
  locale,
  viewLabel = "View Cafe",
}: {
  cafe: Cafe;
  locale: Locale;
  viewLabel?: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.04]">
      <div className="relative h-40 w-full">
        <Image src={cafe.coverImage} alt={cafe.name} fill sizes="(max-width: 767px) 100vw, 600px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden="true" />
        <div className="absolute bottom-3 start-4 flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Coffee size={16} aria-hidden="true" />
          </span>
          <p className="font-display text-lg font-bold drop-shadow-sm">{cafe.name}</p>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {cafe.openingHours && (
          <p className="flex items-center gap-1.5 text-sm text-ink/60 dark:text-sand/60">
            <Clock size={14} className="shrink-0 text-primary" aria-hidden="true" />
            {cafe.openingHours}
          </p>
        )}
        <p className="line-clamp-2 text-sm text-ink/70 dark:text-sand/70">{cafe.shortDescription}</p>
        <Link
          href={`/${locale}/cafes/${cafe.slug}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
        >
          {viewLabel}
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
