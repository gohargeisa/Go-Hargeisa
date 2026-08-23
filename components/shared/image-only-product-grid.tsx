"use client";

import { useState } from "react";
import Image from "next/image";
import { Lightbox, type LightboxSlide } from "@/components/shared/lightbox";

/**
 * Premium, IMAGE-ONLY product grid — for a listing with real photos but no
 * verified per-item name/price/description yet (see
 * lib/config/curated-product-images.ts for why this exists and how it's
 * meant to be temporary). Deliberately renders nothing but the photo: no
 * name, price, or badge, so nothing is implied about each item beyond "this
 * is a real photo already on this listing's gallery." Same card visual
 * language (rounded-xl2, hover lift/zoom, aspect-square) as ProductCard's
 * own image tile, so it reads as part of the same design system once real
 * product data replaces it.
 */
export function ImageOnlyProductGrid({ images, alt }: { images: string[]; alt: string }) {
  const [openAt, setOpenAt] = useState<number | null>(null);

  if (images.length === 0) return null;

  const slides: LightboxSlide[] = images.map((url, i) => ({ url, alt: `${alt} — ${i + 1}` }));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setOpenAt(i)}
            aria-label={`${alt} — ${i + 1}`}
            className="group relative aspect-square overflow-hidden rounded-xl2 bg-ink/5 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5"
          >
            <Image
              src={url}
              alt={`${alt} — ${i + 1}`}
              fill
              sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {openAt !== null && (
        <Lightbox slides={slides} index={openAt} onClose={() => setOpenAt(null)} onIndexChange={setOpenAt} />
      )}
    </div>
  );
}
