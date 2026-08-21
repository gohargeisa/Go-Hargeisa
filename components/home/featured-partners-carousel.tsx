"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Horizontal, arrow-controlled carousel specifically for the homepage
 * Featured Partners row — deliberately its own component rather than a
 * change to components/shared/scroll-row.tsx, which other sections
 * (attractions, offers) already depend on for its current "scroll strip on
 * mobile, static grid on desktop" behavior. Featured Partners is the one
 * section that's meant to stay a slidable row at every width, per the
 * "one clean horizontal carousel/slider... rotate/slide left and right"
 * requirement — native touch/trackpad swipe already works on any
 * `overflow-x-auto` row for free; the buttons here are the desktop-friendly
 * affordance on top of that, not a replacement for it.
 *
 * Scroll-direction math (not just icon rotation) is RTL-aware: modern
 * browsers report a negative `scrollLeft` range in `dir="rtl"` containers,
 * so "forward" must subtract rather than add once direction is RTL. Card
 * width is read from the first real card at click-time rather than
 * hardcoded, so this keeps working if FeaturedPartnerCard's own min-width
 * ever changes.
 */
export function FeaturedPartnersCarousel({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  function updateArrowState() {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 1) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }
    const distanceFromStart = Math.abs(el.scrollLeft);
    setCanScrollPrev(distanceFromStart > 4);
    setCanScrollNext(distanceFromStart < maxScroll - 4);
  }

  useEffect(() => {
    updateArrowState();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrowState, { passive: true });
    window.addEventListener("resize", updateArrowState);
    return () => {
      el.removeEventListener("scroll", updateArrowState);
      window.removeEventListener("resize", updateArrowState);
    };
  }, []);

  function scrollByDirection(forward: boolean) {
    const el = scrollerRef.current;
    if (!el) return;
    const firstCard = el.firstElementChild as HTMLElement | null;
    const step = (firstCard?.offsetWidth ?? 300) + 20;
    const isRtl = getComputedStyle(el).direction === "rtl";
    const sign = isRtl ? -1 : 1;
    el.scrollBy({ left: (forward ? sign : -sign) * step, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex items-stretch gap-4 overflow-x-auto pb-3 -mx-5 px-5 sm:gap-5 md:mx-0 md:px-0 scroll-smooth scrollbar-none"
        style={{ scrollSnapType: "x proximity" }}
      >
        {children}
      </div>

      {(canScrollPrev || canScrollNext) && (
        <div className="mt-4 hidden items-center justify-end gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollByDirection(false)}
            disabled={!canScrollPrev}
            aria-label={t("previous")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-30 dark:border-white/20 dark:text-white"
          >
            <ChevronLeft size={18} aria-hidden="true" className="rtl:rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => scrollByDirection(true)}
            disabled={!canScrollNext}
            aria-label={t("next")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-30 dark:border-white/20 dark:text-white"
          >
            <ChevronRight size={18} aria-hidden="true" className="rtl:rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}
