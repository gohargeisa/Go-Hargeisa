"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";

export interface LightboxSlide {
  url: string;
  alt: string;
  caption?: string;
}

const SWIPE_THRESHOLD_PX = 50;
/** Double-tap window on touch devices — desktop gets a real `onDoubleClick`,
 * which doesn't exist as a native event for touch. */
const DOUBLE_TAP_MS = 300;

/**
 * Fullscreen photo viewer shared by every detail page's gallery (hotels,
 * restaurants, cafes, attractions, services) plus any card that opens a
 * gallery directly (e.g. eligible City Services categories) — one shared
 * component, not a per-type copy.
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
  const [zoomed, setZoomed] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef(0);

  const goPrev = useCallback(
    () => onIndexChange((index - 1 + slides.length) % slides.length),
    [index, slides.length, onIndexChange]
  );
  const goNext = useCallback(() => onIndexChange((index + 1) % slides.length), [index, slides.length, onIndexChange]);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);

  // Zoom is per-slide — moving to a different photo always starts unzoomed.
  useEffect(() => {
    setZoomed(false);
  }, [index]);

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

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;

    // Double-tap toggles zoom before anything else — a real second tap in
    // roughly the same spot, not a swipe (large horizontal movement rules
    // this out on its own via the swipe branch below).
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < DOUBLE_TAP_MS && Math.abs(dx) < 10 && Math.abs(dy) < 10;
    lastTapRef.current = now;
    if (isDoubleTap) {
      setZoomed((z) => !z);
      return;
    }

    // Swipe navigation only makes sense unzoomed — while zoomed a
    // horizontal drag is for panning, not changing slides.
    if (zoomed) return;
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }
  }

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            aria-label={zoomed ? "Zoom out" : "Zoom in"}
            aria-pressed={zoomed}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
          >
            {zoomed ? <ZoomOut size={18} aria-hidden="true" /> : <ZoomIn size={18} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo viewer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className={`relative flex-1 overflow-hidden ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onDoubleClick={() => setZoomed((z) => !z)}
      >
        <Image
          src={slide.url}
          alt={slide.alt}
          fill
          sizes="100vw"
          className={`object-contain transition-transform duration-300 ease-premium ${zoomed ? "scale-[2]" : "scale-100"}`}
          priority
        />

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

      {slide.caption && (
        <p className="px-4 pb-4 text-center text-sm text-white/70 sm:px-6">{slide.caption}</p>
      )}
    </div>
  );
}
