"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryImage } from "@/types";

interface Slide {
  url: string;
  alt: string;
}

export function HotelGallery({
  cover,
  images,
  alt,
}: {
  cover: string;
  images: GalleryImage[];
  alt: string;
}) {
  const slides: Slide[] = [
    { url: cover, alt },
    ...images.map((img, i) => ({ url: img.url, alt: img.alt || `${alt} — photo ${i + 2}` })),
  ];
  const thumbnails = slides.slice(1, 5);
  const [openAt, setOpenAt] = useState<number | null>(null);

  return (
    <div className="container-px mx-auto pt-6">
      {/* Desktop: large main image + up to 4 thumbnails */}
      <div className="hidden gap-2 overflow-hidden rounded-xl3 lg:grid lg:h-[440px] lg:grid-cols-4 lg:grid-rows-2">
        <button
          type="button"
          onClick={() => setOpenAt(0)}
          className="group relative col-span-2 row-span-2 block overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={`View ${alt} photos`}
        >
          <Image src={slides[0].url} alt={slides[0].alt} fill priority sizes="50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        </button>

        {thumbnails.length > 0 ? (
          thumbnails.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setOpenAt(i + 1)}
              className="group relative block overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label={`View ${alt} photo ${i + 2}`}
            >
              <Image src={s.url} alt={s.alt} fill sizes="25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              {i === 3 && slides.length > 5 && (
                <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-sm font-semibold text-white">
                  +{slides.length - 5} more
                </span>
              )}
            </button>
          ))
        ) : (
          <div className="col-span-2 row-span-2 hidden lg:block" aria-hidden="true" />
        )}
      </div>

      {/* Tablet: 2-column grid */}
      <div className="hidden grid-cols-2 gap-2 overflow-hidden rounded-xl3 sm:grid lg:hidden">
        {slides.slice(0, 4).map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenAt(i)}
            className="group relative block h-52 overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label={i === 0 ? `View ${alt} photos` : `View ${alt} photo ${i + 1}`}
          >
            <Image src={s.url} alt={s.alt} fill sizes="50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            {i === 3 && slides.length > 4 && (
              <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-sm font-semibold text-white">
                +{slides.length - 4} more
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mobile: horizontal scroll gallery */}
      <div className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-1 scrollbar-none sm:hidden">
        {slides.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenAt(i)}
            className="relative h-56 w-[84vw] shrink-0 snap-start overflow-hidden rounded-xl2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label={i === 0 ? `View ${alt} photos` : `View ${alt} photo ${i + 1}`}
          >
            <Image src={s.url} alt={s.alt} fill sizes="84vw" className="object-cover" priority={i === 0} />
          </button>
        ))}
      </div>

      {openAt !== null && (
        <Lightbox slides={slides} index={openAt} onClose={() => setOpenAt(null)} onIndexChange={setOpenAt} />
      )}
    </div>
  );
}

function Lightbox({
  slides,
  index,
  onClose,
  onIndexChange,
}: {
  slides: Slide[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const goPrev = useCallback(
    () => onIndexChange((index - 1 + slides.length) % slides.length),
    [index, slides.length, onIndexChange]
  );
  const goNext = useCallback(() => onIndexChange((index + 1) % slides.length), [index, slides.length, onIndexChange]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goPrev, goNext]);

  const slide = slides[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white sm:px-6">
        <p className="text-sm text-white/70">
          {index + 1} / {slides.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo viewer"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex-1">
        <Image src={slide.url} alt={slide.alt} fill sizes="100vw" className="object-contain" priority />

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous photo"
              className="absolute start-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:start-4"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next photo"
              className="absolute end-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:end-4"
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
