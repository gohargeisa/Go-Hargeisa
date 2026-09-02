"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand } from "lucide-react";
import { Lightbox, type LightboxSlide } from "@/components/shared/lightbox";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import type { GalleryImage } from "@/types";

/**
 * Al-Hikma gallery — one large lead image + a supporting grid, all opening a
 * shared Lightbox. Used for the clinic's own `service.gallery` photos when it
 * has them, and for the illustrative fallback set otherwise (the caller
 * decides which and passes `isIllustrative` so the "photos are illustrative"
 * note can render).
 */
export function AlHikmaGallery({
  images,
  isIllustrative,
  illustrativeNote,
  whatsappHref,
  whatsappPromptText,
  whatsappButtonLabel,
}: {
  images: GalleryImage[];
  isIllustrative: boolean;
  illustrativeNote: string;
  whatsappHref?: string;
  whatsappPromptText?: string;
  whatsappButtonLabel?: string;
}) {
  const [openAt, setOpenAt] = useState<number | null>(null);

  if (images.length === 0) return null;

  const slides: LightboxSlide[] = images.map((img, i) => ({
    url: img.url,
    alt: img.alt || `Al-Hikma — photo ${i + 1}`,
    caption: img.caption,
  }));

  const [lead, ...rest] = images;
  const gridImages = rest.slice(0, 5);

  const Tile = ({ img, index, className }: { img: GalleryImage; index: number; className: string }) => (
    <button
      type="button"
      onClick={() => setOpenAt(index)}
      aria-label={img.alt || `Open photo ${index + 1}`}
      className={`group relative overflow-hidden rounded-xl2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
    >
      <Image
        src={img.url}
        alt={img.alt || `Al-Hikma — photo ${index + 1}`}
        fill
        sizes="(max-width: 640px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/10" />
    </button>
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setOpenAt(0)}
          aria-label={lead.alt || "Open photo 1"}
          className="group relative col-span-2 aspect-[4/3] overflow-hidden rounded-xl3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:row-span-2 sm:aspect-auto"
        >
          <Image
            src={lead.url}
            alt={lead.alt || "Al-Hikma — photo 1"}
            fill
            sizes="(max-width: 640px) 100vw, 66vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority={false}
          />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-ink/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <Expand size={13} aria-hidden="true" />
            {images.length}
          </span>
        </button>

        {gridImages.map((img, i) => (
          <Tile key={img.url} img={img} index={i + 1} className="aspect-square" />
        ))}
      </div>

      {isIllustrative && (
        <p className="mt-3 text-xs italic text-ink/45 dark:text-sand/45">{illustrativeNote}</p>
      )}

      {whatsappHref && whatsappPromptText && whatsappButtonLabel && (
        <div className="mt-6 flex flex-col items-center gap-2.5 text-center">
          <p className="max-w-md text-sm text-ink/65 dark:text-sand/65">{whatsappPromptText}</p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-[#1FB855] active:scale-95"
          >
            <WhatsAppIcon size={16} aria-hidden="true" />
            {whatsappButtonLabel}
          </a>
        </div>
      )}

      {openAt !== null && (
        <Lightbox slides={slides} index={openAt} onClose={() => setOpenAt(null)} onIndexChange={setOpenAt} />
      )}
    </div>
  );
}
