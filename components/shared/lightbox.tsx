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
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

function touchDistance(a: React.Touch, b: React.Touch) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

/** Keeps the panned image from drifting past its own edges — the further
 * zoomed in, the more room there is to pan, roughly proportional to how much
 * the image now overhangs the viewport on each axis. */
function clampPan(value: number, scale: number, viewportSize: number) {
  const maxOffset = (viewportSize * (scale - 1)) / 2;
  return Math.min(maxOffset, Math.max(-maxOffset, value));
}

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
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const zoomed = scale > 1;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);

  const goPrev = useCallback(
    () => onIndexChange((index - 1 + slides.length) % slides.length),
    [index, slides.length, onIndexChange]
  );
  const goNext = useCallback(() => onIndexChange((index + 1) % slides.length), [index, slides.length, onIndexChange]);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);

  // Zoom is per-slide — moving to a different photo always starts unzoomed.
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
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

  function toggleZoom() {
    if (zoomed) {
      setScale(1);
      setPan({ x: 0, y: 0 });
    } else {
      setScale(DOUBLE_TAP_SCALE);
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinchRef.current = { startDist: touchDistance(e.touches[0], e.touches[1]), startScale: scale };
      panRef.current = null;
      touchStartRef.current = null;
      return;
    }

    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
    if (zoomed) {
      panRef.current = { startX: t.clientX, startY: t.clientY, startPanX: pan.x, startPanY: pan.y };
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current) {
      const dist = touchDistance(e.touches[0], e.touches[1]);
      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, pinchRef.current.startScale * (dist / pinchRef.current.startDist))
      );
      setScale(nextScale);
      return;
    }

    if (e.touches.length === 1 && panRef.current) {
      const t = e.touches[0];
      const viewport = viewportRef.current;
      if (!viewport) return;
      const dx = t.clientX - panRef.current.startX;
      const dy = t.clientY - panRef.current.startY;
      setPan({
        x: clampPan(panRef.current.startPanX + dx, scale, viewport.clientWidth),
        y: clampPan(panRef.current.startPanY + dy, scale, viewport.clientHeight),
      });
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (e.touches.length > 0) return; // still mid-gesture (e.g. lifting one of two fingers)
    pinchRef.current = null;
    panRef.current = null;
    // A pinch can end below MIN_SCALE's floor only if clamped already; snap
    // fully-out pinches back to the unzoomed baseline.
    if (scale <= MIN_SCALE) {
      setScale(1);
      setPan({ x: 0, y: 0 });
    }

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
      toggleZoom();
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
            onClick={toggleZoom}
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
        ref={viewportRef}
        className={`relative flex-1 touch-none overflow-hidden ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={toggleZoom}
      >
        <Image
          src={slide.url}
          alt={slide.alt}
          fill
          sizes="100vw"
          className={`object-contain ${pinchRef.current ? "" : "transition-transform duration-300 ease-premium"}`}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
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
