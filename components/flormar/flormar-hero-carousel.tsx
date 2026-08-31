"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/utils/shimmer";

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;

/**
 * Flormar hero campaign image carousel — the IMAGE panel only, not the text.
 * The hero's headline/subtitle/CTAs live in a separate, static white text
 * panel next to this (see flormar-storefront.tsx) rather than being
 * overlaid on top of each photo: with 5 real campaign photos of differing
 * compositions (some centered, some off-center, one showing two products
 * side by side), no single fixed text position could avoid ever covering a
 * model's face or a product across all of them without per-image tuning
 * this project has no way to visually verify right now. Keeping the text
 * off the image entirely guarantees "never covers the face/product" and
 * "excellent contrast" are both true on every slide, not just the ones a
 * particular overlay position happened to suit.
 *
 * All 5 source photos are real, local Flormar Hargeisa campaign photography
 * (business-owner-supplied, copied byte-for-byte into
 * public/images/partners/flormar/campaign/) — nothing generated or stock.
 */
export function FlormarHeroCarousel({ images }: { images: { src: string; alt: string }[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const touchStartX = useRef<number | null>(null);

  const multiSlide = images.length > 1;

  useEffect(() => {
    if (!multiSlide || paused || reduceMotion) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [multiSlide, paused, reduceMotion, images.length]);

  function goTo(next: number) {
    setIndex(((next % images.length) + images.length) % images.length);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const deltaX = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    goTo(deltaX < 0 ? index + 1 : index - 1);
  }

  const current = images[index];
  if (!current) return null;

  return (
    <div
      className="group relative h-full w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={current.src}
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={current.src}
            alt={current.alt}
            fill
            priority
            quality={92}
            sizes="(max-width: 639px) 100vw, 46vw"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            className="object-cover object-top"
          />
        </m.div>
      </AnimatePresence>

      {multiSlide && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous"
            className="absolute start-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink opacity-0 shadow-soft backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next"
            className="absolute end-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink opacity-0 shadow-soft backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>

          <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-1.5">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === index}
                className="h-1.5 rounded-full bg-white/60 transition-all duration-300"
                style={{ width: i === index ? "20px" : "6px", backgroundColor: i === index ? "#fff" : "rgba(255,255,255,0.6)" }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
