"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand } from "lucide-react";
import { Lightbox, type LightboxSlide } from "@/components/shared/lightbox";

/**
 * Curated gallery for the Mama & Baby Care storefront — one large lead tile
 * + a supporting grid, all opening the shared Lightbox. Every image is the
 * shop's own real product photography (lib/config/mama-baby-care-media.ts),
 * so unlike Al-Hikma's gallery this never shows an "illustrative" note.
 */
export function MamaBabyCareGallery({ images }: { images: { url: string; alt: string }[] }) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  if (images.length === 0) return null;

  const slides: LightboxSlide[] = images.map((img) => ({ url: img.url, alt: img.alt }));
  const [lead, ...rest] = images;
  const gridImages = rest.slice(0, 5);

  const Tile = ({ img, index, className }: { img: { url: string; alt: string }; index: number; className: string }) => (
    <button
      type="button"
      onClick={() => setOpenAt(index)}
      aria-label={img.alt}
      className={`group relative overflow-hidden rounded-xl2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
    >
      <Image src={img.url} alt={img.alt} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
      <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/10" />
    </button>
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setOpenAt(0)}
          aria-label={lead.alt}
          className="group relative col-span-2 aspect-[4/3] overflow-hidden rounded-xl3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:row-span-2 sm:aspect-auto"
        >
          <Image src={lead.url} alt={lead.alt} fill sizes="(max-width: 640px) 100vw, 66vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-ink/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <Expand size={13} aria-hidden="true" />
            {images.length}
          </span>
        </button>

        {gridImages.map((img, i) => (
          <Tile key={img.url} img={img} index={i + 1} className="aspect-square" />
        ))}
      </div>

      {openAt !== null && <Lightbox slides={slides} index={openAt} onClose={() => setOpenAt(null)} onIndexChange={setOpenAt} />}
    </div>
  );
}
