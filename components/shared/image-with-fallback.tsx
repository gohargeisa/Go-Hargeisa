"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";

/**
 * A drop-in `next/image` for photos whose URL comes from user/business data
 * and may be missing, empty, or dead. On a missing `src` or a failed load it
 * renders the same clean, intentional "no photo" placeholder used by
 * ProductImage — never an empty box or the browser's broken-image glyph —
 * while filling its parent so layout never shifts.
 *
 * Use this anywhere a raw <Image> currently renders a `GalleryImage.url`,
 * `product.gallery[].url`, or any other optional/remote image. Product grid
 * and product-detail *primary* photos already go through ProductImage; this
 * covers the secondary surfaces (gallery grids, thumbnail strips, hero
 * crossfades) that were still using a bare <Image>.
 *
 * Parent must be `position: relative` with a real size — the same contract
 * `fill` already requires.
 */
export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackClassName,
  onError,
  ...rest
}: Omit<ImageProps, "src"> & {
  src?: string | null;
  /** Extra classes for the placeholder box (e.g. a matching rounded corner). */
  fallbackClassName?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    const labelledAlt = typeof alt === "string" && alt.trim() ? alt : undefined;
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-ink/5 dark:bg-white/5 ${fallbackClassName ?? ""}`}
        role={labelledAlt ? "img" : "presentation"}
        aria-label={labelledAlt}
      >
        <ImageOff className="h-6 w-6 text-ink/25 dark:text-sand/25" aria-hidden="true" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        setErrored(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}
