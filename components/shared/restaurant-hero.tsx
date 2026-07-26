import Image from "next/image";
import { Building2, MapPin, Sparkles, Star } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { hasMeaningfulPrice } from "@/lib/utils/price-range";

export function RestaurantHero({
  image,
  name,
  address,
  rating,
  reviewCount,
  priceRange,
  cuisine,
  featured,
}: {
  image: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  priceRange?: string;
  cuisine: string[];
  featured?: boolean;
}) {
  const hasRealImage = Boolean(image) && !image.includes("placehold.co");

  return (
    <section className="relative h-[42vh] max-h-[520px] min-h-[340px] w-full overflow-hidden sm:h-[52vh]">
      {hasRealImage ? (
        <Image src={image} alt={`${name} — restaurant interior`} fill priority sizes="100vw" className="object-cover" />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/25 via-secondary/15 to-primary/10 dark:from-primary/25 dark:via-secondary/25 dark:to-white/5"
          aria-hidden="true"
        >
          <Building2 size={64} strokeWidth={1.5} className="text-primary/40" />
        </div>
      )}

      <div
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10"
        aria-hidden="true"
      />

      {featured && (
        <span className="absolute start-5 top-5 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm sm:start-8 sm:top-8">
          <Sparkles size={12} aria-hidden="true" />
          Featured
        </span>
      )}

      <div className="absolute end-5 top-5 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-sm font-bold text-ink shadow-sm dark:bg-ink/90 dark:text-white sm:end-8 sm:top-8">
        <Star size={14} fill="currentColor" className="text-primary" aria-hidden="true" />
        {rating.toFixed(1)}
        {reviewCount > 0 && (
          <span className="font-normal text-ink/50 dark:text-sand/50">({reviewCount})</span>
        )}
      </div>

      <Reveal y={16}>
        <div className="container-px absolute inset-x-0 bottom-0 mx-auto pb-6 text-white sm:pb-10">
          {cuisine.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {cuisine.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm sm:text-sm"
                >
                  {c}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-balance font-display text-3xl font-bold drop-shadow-sm sm:text-4xl lg:text-5xl">
            {name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/90 sm:text-base">
            <span className="flex items-center gap-1.5">
              <MapPin size={16} className="shrink-0" aria-hidden="true" />
              {address}
            </span>
            {hasMeaningfulPrice(priceRange) && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm sm:text-sm">
                {priceRange}
              </span>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
