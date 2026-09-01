"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import type { GalleryImage } from "@/types";
import { Lightbox, type LightboxSlide } from "@/components/shared/lightbox";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/utils/shimmer";
import { BrandedPlaceholder } from "@/components/shared/branded-placeholder";
import { isPlaceholderImage } from "@/lib/utils/is-placeholder-image";
import { getGalleryImageFit } from "@/lib/utils/gallery-image-fit";

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
  productOriented = false,
}: {
  cover: string;
  images: GalleryImage[];
  alt: string;
  /** City Services only (categories.supports_products) — when true, any
   * slide not explicitly tagged otherwise (see lib/utils/gallery-image-fit.ts)
   * preserves the complete photo instead of cropping it to fill the wide
   * hero frame. Never passed by hotels/restaurants/cafes/services, so their
   * existing cover-only presentation is completely unchanged. */
  productOriented?: boolean;
}) {
  const t = useTranslations("hotelDetail");
  const tc = useTranslations("common");

  const slides: LightboxSlide[] = [
    { url: cover, alt },
    ...images.map((img, i) => ({ url: img.url, alt: img.alt || `${alt} — photo ${i + 2}`, caption: img.caption })),
  ];
  const fits = [
    getGalleryImageFit(undefined, productOriented),
    ...images.map((img) => getGalleryImageFit(img, productOriented)),
  ];
  // No real gallery uploaded yet and the cover is just a generated
  // placehold.co placeholder — show a branded placeholder instead of
  // rendering that literal "text on a color block" image at full hero size.
  const isSinglePlaceholder = slides.length === 1 && isPlaceholderImage(slides[0].url);

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
    const onPointerDown = () => setIsPaused(true);
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("pointerDown", onPointerDown);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("pointerDown", onPointerDown);
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
    <div className="container-px mx-auto pt-4 sm:pt-8">
      <h2 className="mb-2.5 font-display text-lg font-semibold text-ink dark:text-white sm:mb-3 sm:text-xl">
        {tc("gallery")}
        {slides.length > 1 && (
          <span className="ms-2 font-body text-sm font-medium text-ink/70 dark:text-sand/70">
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
                /* Mobile trimmed (44vh / 248–440px) so the hero photo stays a
                   header, not the whole first screen, in the Android WebView;
                   `sm:` restores the original desktop sizing unchanged. */
                className="relative h-[44vh] max-h-[440px] min-h-[248px] w-full shrink-0 grow-0 basis-full sm:h-[54vh] sm:max-h-[520px] sm:min-h-[300px]"
              >
                {isSinglePlaceholder ? (
                  <BrandedPlaceholder name={alt} className="absolute inset-0" />
                ) : (
                  <>
                    {!loaded[i] && (
                      <div className="absolute inset-0 animate-pulse bg-ink/10 dark:bg-white/10" aria-hidden="true" />
                    )}
                    {fits[i] === "contain" && (
                      <div className="absolute inset-0 bg-ink/5 dark:bg-white/5" aria-hidden="true" />
                    )}
                    <Image
                      src={s.url}
                      alt={s.alt}
                      fill
                      priority={i === 0}
                      quality={90}
                      sizes="100vw"
                      placeholder="blur"
                      blurDataURL={SHIMMER_BLUR_DATA_URL}
                      onLoad={() => setLoaded((l) => ({ ...l, [i]: true }))}
                      className={`${fits[i] === "contain" ? "object-contain" : "object-cover"} transition-opacity duration-500 ${loaded[i] ? "opacity-100" : "opacity-0"}`}
                    />
                    {fits[i] !== "contain" && (
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              aria-label={t("previousPhoto")}
              className="absolute start-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-all duration-200 hover:scale-110 hover:bg-white dark:bg-ink/80 dark:text-white dark:hover:bg-ink sm:start-4"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label={t("nextPhoto")}
              className="absolute end-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-all duration-200 hover:scale-110 hover:bg-white dark:bg-ink/80 dark:text-white dark:hover:bg-ink sm:end-4"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
            <span className="absolute bottom-3 start-3 z-10 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm sm:bottom-4 sm:start-4">
              {selectedIndex + 1} / {slides.length}
            </span>
          </>
        )}

        {!isSinglePlaceholder && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={t("viewFullscreenGallery")}
            className="absolute bottom-3 end-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/70 sm:bottom-4 sm:end-4"
          >
            <Expand size={13} aria-hidden="true" />
            {t("viewAllPhotos")}
          </button>
        )}
      </div>

      {slides.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5" aria-label={t("gallerySlidesAriaLabel")}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setIsPaused(true);
                emblaApi?.scrollTo(i);
              }}
              aria-label={t("goToPhoto", { number: i + 1 })}
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
