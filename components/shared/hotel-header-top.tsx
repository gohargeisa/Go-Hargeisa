import Image from "next/image";
import { Building2, MapPin, Star } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { hotelCategoryLabel } from "@/lib/utils/hotel-category";

/**
 * Centered logo / name / rating block shown above the hero gallery — this
 * replaces the old image-overlay hero title (components/shared/hotel-hero.tsx,
 * now unused) per the spec's "logo above name" layout, while reusing the
 * exact same font-display / primary / accent tokens as the rest of the site.
 * Logo styled as a small "luxury badge" (fixed size, thin white ring, soft
 * glass shadow, hover lift) per the premium-polish passes.
 */
export function HotelHeaderTop({
  logo,
  name,
  rating,
  reviewCount,
  priceRange,
}: {
  logo?: string;
  name: string;
  rating: number;
  reviewCount: number;
  priceRange?: string;
}) {
  return (
    <Reveal>
      <div className="container-px mx-auto flex flex-col items-center pt-8 text-center sm:pt-12">
        <div className="group relative mb-5 h-[108px] w-[108px] shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-glass transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 hover:shadow-card dark:border-white/90 dark:bg-white/5 sm:h-32 sm:w-32">
          {logo ? (
            <Image
              src={logo}
              alt={`${name} logo`}
              fill
              sizes="128px"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 dark:from-primary/20 dark:via-secondary/20 dark:to-white/5">
              <Building2 size={36} strokeWidth={1.5} className="text-primary/50" aria-hidden="true" />
            </div>
          )}
        </div>

        <h1 className="text-balance font-display text-3xl font-bold sm:text-4xl lg:text-5xl">{name}</h1>

        <div className="mt-3.5 flex items-center gap-2.5">
          <div className="flex gap-1 text-primary-600">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={19} fill={i < Math.round(rating) ? "currentColor" : "none"} strokeWidth={1.5} />
            ))}
          </div>
          <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
          {reviewCount > 0 && (
            <span className="text-sm text-ink/50 dark:text-sand/50">({reviewCount} reviews)</span>
          )}
        </div>

        <p className="mt-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-medium text-ink/55 dark:text-sand/55">
          <span className="font-semibold text-ink/75 dark:text-sand/75">{hotelCategoryLabel(priceRange)}</span>
          <span aria-hidden="true" className="text-ink/25 dark:text-sand/25">
            •
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} className="text-primary" aria-hidden="true" />
            Hargeisa, Somaliland
          </span>
        </p>
      </div>
    </Reveal>
  );
}
