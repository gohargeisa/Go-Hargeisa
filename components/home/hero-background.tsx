"use client";

import Image from "next/image";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/utils/shimmer";

/**
 * Hero photo + brand gradient overlays — extracted verbatim from Hero's own
 * background (zero visual change to Hero itself) so the splash overlay
 * (components/shared/splash-overlay.tsx) can render a second instance with
 * identical props. Next.js's image optimizer generates the identical
 * /_next/image URL for both instances (same src/sizes/fill), so the
 * browser's own cache/decode makes the splash-to-Hero crossfade pixel-
 * identical rather than just visually similar — this is the actual
 * mechanism behind "the Hero background must visually continue into the
 * homepage," not a coincidence of matching styling.
 */
export function HeroBackground({
  reduceMotion,
  priority = true,
  onReady,
}: {
  reduceMotion: boolean;
  priority?: boolean;
  /** Fires once the actual image bytes have loaded — used by the splash
   * overlay to know when it's safe to reveal itself and hand the native
   * splash off (see native-splash-gate.tsx). Unused by Hero itself. */
  onReady?: () => void;
}) {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/images/hero-bg.png"
          alt="Panoramic view of Hargeisa at golden hour"
          fill
          priority={priority}
          sizes="100vw"
          placeholder="blur"
          blurDataURL={SHIMMER_BLUR_DATA_URL}
          className={`object-cover ${reduceMotion ? "" : "animate-kenburns"}`}
          onLoad={onReady}
        />
      </div>

      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/10" />
    </>
  );
}
