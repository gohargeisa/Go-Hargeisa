import Image from "next/image";
import { EXCELLENCE_CAFE_FEATURED } from "@/lib/config/excellence-cafe-photos";
import { humanizePhotoKey } from "@/lib/utils/humanize-photo-key";

/**
 * Featured Dishes — real photography only, captioned with a plain
 * description derived from the photo's own filename/key rather than an
 * exact menu-item name+price. Deliberately not claiming "best seller" (no
 * sales data exists to support that) and deliberately not pinning each
 * photo to one specific priced menu row (several photos plausibly match
 * more than one similarly-named item — e.g. a kofta-skewer photo could be
 * "Kufta" or "Biryani Kufta" — asserting one would be a guess this page's
 * own sourcing rules don't allow).
 */
export function ExcellenceCafeFeatured() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {EXCELLENCE_CAFE_FEATURED.map((photo) => (
        <figure
          key={photo.key}
          className="group relative aspect-square overflow-hidden rounded-xl2 border border-ink/8 shadow-sm dark:border-white/10"
        >
          <Image
            src={photo.src}
            alt={humanizePhotoKey(photo.key)}
            fill
            sizes="(max-width: 639px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-premium group-hover:scale-[1.06]"
          />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent p-3 pt-8">
            <span className="text-xs font-semibold text-white">{humanizePhotoKey(photo.key)}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
