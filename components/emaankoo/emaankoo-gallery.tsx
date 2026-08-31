"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Lightbox, type LightboxSlide } from "@/components/shared/lightbox";
import type { GalleryImage } from "@/types";

/**
 * Emaankoo-only curated gallery — a plain, fully-i18n grid + the shared
 * Lightbox, deliberately NOT the shared BusinessPhotoGallery: that component's
 * category-filter pills render hardcoded-English labels from
 * EMAANKOO_GALLERY_CATEGORIES ("Products & Shipments" etc.), which would leak
 * English onto /ar and /so. This page's gallery is already hand-curated in the
 * storefront (event/entertainment photos filtered out there), so no in-grid
 * category filter is needed anyway.
 */
export function EmaankooGallery({ images }: { images: GalleryImage[] }) {
  const t = useTranslations("emaankooStorefront");
  const [openAt, setOpenAt] = useState<number | null>(null);

  if (images.length === 0) return null;

  const slides: LightboxSlide[] = images.map((img, i) => ({
    url: img.url,
    alt: img.alt || t("galleryPhotoLabel", { number: i + 1 }),
    caption: img.caption,
  }));

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <button
            key={`${img.url}-${i}`}
            type="button"
            onClick={() => setOpenAt(i)}
            aria-label={t("galleryPhotoLabel", { number: i + 1 })}
            className="group relative aspect-square overflow-hidden rounded-lg border border-ink/10 bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/10 dark:bg-white/5"
          >
            <Image
              src={img.url}
              alt={img.alt || t("galleryPhotoLabel", { number: i + 1 })}
              fill
              sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {openAt !== null && (
        <Lightbox slides={slides} index={openAt} onClose={() => setOpenAt(null)} onIndexChange={setOpenAt} />
      )}
    </>
  );
}
