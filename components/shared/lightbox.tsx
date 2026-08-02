"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";

export interface LightboxSlide {
  url: string;
  alt: string;
}

/**
 * Fullscreen photo viewer shared by the hotel hero slider and the
 * categorized photo gallery — deliberately NOT the same component as the
 * lightbox baked into components/shared/hotel-gallery.tsx, since that file
 * is also used by the restaurant and cafe detail pages and must stay
 * untouched by this hotel-only redesign.
 */
export function Lightbox({
  slides,
  index,
  onClose,
  onIndexChange,
}: {
  slides: LightboxSlide[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const goPrev = useCallback(
    () => onIndexChange((index - 1 + slides.length) % slides.length),
    [index, slides.length, onIndexChange]
  );
  const goNext = useCallback(() => onIndexChange((index + 1) % slides.length), [index, slides.length, onIndexChange]);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);

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
  if (!slide) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      tabIndex={-1}
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
