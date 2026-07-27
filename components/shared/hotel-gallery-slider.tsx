"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import type { GalleryImage } from "@/types";
import { Lightbox, type LightboxSlide } from "@/components/shared/lightbox";

const AUTOPLAY_MS = 5000;

/**
 * Premium swipeable hero gallery — the "Hero Gallery" from the spec. Uses
 * embla-carousel-react (already an installed but previously-unused
 * dependency) for swipe + slide transitions, a manual setInterval for
 * autoplay (paused on any user interaction) since the autoplay plugin
 * package isn't installed, and the shared Lightbox for fullscreen viewing.
 * This is a brand-new hotel-only component — it does not touch
 * components/shared/hotel-gallery.tsx, which restaurants/cafes still use.
 */
export function HotelGallerySlider({
  cover,
  images,
  alt,
}: {
  cover: string;
  images: GalleryImage[];
  alt: string;
}) {
  const t = useTranslations("hotelDetail");
  const tc = useTranslations("common");

  const slides: LightboxSlide[] = [
    { url: cover, alt },
    ...images.map((img, i) => ({ url: img.url, alt: img.alt || `${alt} — photo ${i + 2}` })),
  ];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: slides.length > 1, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("pointerDown", () => setIsPaused(true));
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || isPaused || slides.length <= 1) return;
    const id = setInterval(() => emblaApi.scrollNext(), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [emblaApi, isPaused, slides.length]);

  const scrollPrev = useCallback(() => {
    setIsPaused(true);
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    setIsPaused(true);
    emblaApi?.scrollNext();
  }, [emblaApi]);

  return (
    <div className="container-px mx-auto pt-7 sm:pt-8">
      <h2 className="mb-3 font-display text-lg font-semibold text-ink dark:text-white sm:text-xl">
        {tc("gallery")}
        {slides.length > 1 && (
          <span className="ms-2 font-body text-sm font-medium text-ink/45 dark:text-sand/45">
            ({t("photosCount", { count: slides.length })})
          </span>
        )}
      </h2>
      <div className="group relative overflow-hidden rounded-xl3 shadow-card">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {slides.map((s, i) => (
              <div
                key={i}
                className="relative h-[46vh] max-h-[520px] min-h-[280px] w-full shrink-0 grow-0 basis-full sm:h-[52vh]"
              >
                {!loaded[i] && (
                  <div className="absolute inset-0 animate-pulse bg-ink/10 dark:bg-white/10" aria-hidden="true" />
                )}
                <Image
                  src={s.url}
                  alt={s.alt}
                  fill
                  priority={i === 0}
                  quality={90}
                  sizes="100vw"
                  onLoad={() => setLoaded((l) => ({ ...l, [i]: true }))}
                  className={`object-cover transition-opacity duration-500 ${loaded[i] ? "opacity-100" : "opacity-0"}`}
                />
              </div>
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Previous photo"
              className="absolute start-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-all duration-200 hover:scale-110 hover:bg-white dark:bg-ink/80 dark:text-white dark:hover:bg-ink sm:start-4"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Next photo"
              className="absolute end-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-all duration-200 hover:scale-110 hover:bg-white dark:bg-ink/80 dark:text-white dark:hover:bg-ink sm:end-4"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
            <span className="absolute bottom-3 start-3 z-10 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm sm:bottom-4 sm:start-4">
              {selectedIndex + 1} / {slides.length}
            </span>
          </>
        )}

        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="View fullscreen gallery"
          className="absolute bottom-3 end-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/70 sm:bottom-4 sm:end-4"
        >
          <Expand size={13} aria-hidden="true" />
          View all
        </button>
      </div>

      {slides.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5" aria-label="Gallery slides">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setIsPaused(true);
                emblaApi?.scrollTo(i);
              }}
              aria-label={`Go to photo ${i + 1}`}
              aria-current={i === selectedIndex}
              className={`h-1.5 rounded-full transition-all ${
                i === selectedIndex ? "w-6 bg-primary" : "w-1.5 bg-ink/20 dark:bg-white/20"
              }`}
            />
          ))}
        </div>
      )}

      {lightboxOpen && (
        <Lightbox
          slides={slides}
          index={selectedIndex}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={(i) => {
            setSelectedIndex(i);
            emblaApi?.scrollTo(i);
          }}
        />
      )}
    </div>
  );
}
