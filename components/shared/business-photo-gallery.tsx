"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { GalleryCategoryOption } from "@/lib/utils/gallery-categories";
import { Lightbox, type LightboxSlide } from "@/components/shared/lightbox";
import type { GalleryImage } from "@/types";

function pillClass(active: boolean) {
  return `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
    active
      ? "bg-primary text-white"
      : "border border-ink/12 text-ink/70 hover:border-primary hover:text-primary dark:border-white/15 dark:text-sand/70"
  }`;
}

/**
 * Categorized photo gallery, shared by hotel/restaurant/cafe detail pages —
 * each passes its own category list from lib/utils/gallery-categories.ts.
 * Separate from any hero gallery/slider; each category filters into its own
 * lightbox.
 */
export function BusinessPhotoGallery({
  images,
  alt,
  categories,
}: {
  images: GalleryImage[];
  alt: string;
  categories: GalleryCategoryOption[];
}) {
  const categoriesPresent = useMemo(() => {
    const present = new Set<string>();
    for (const img of images) present.add(img.category ?? "other");
    return categories.filter((c) => present.has(c.value));
  }, [images, categories]);

  const [active, setActive] = useState<string>("all");
  const [openAt, setOpenAt] = useState<number | null>(null);

  if (images.length === 0) return null;

  const filtered = active === "all" ? images : images.filter((img) => (img.category ?? "other") === active);
  const slides: LightboxSlide[] = filtered.map((img, i) => ({
    url: img.url,
    alt: img.alt || `${alt} — photo ${i + 1}`,
    caption: img.caption,
  }));

  return (
    <div>
      {categoriesPresent.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => setActive("all")} className={pillClass(active === "all")}>
            All ({images.length})
          </button>
          {categoriesPresent.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setActive(c.value)}
              className={pillClass(active === c.value)}
            >
              {c.label} ({images.filter((img) => (img.category ?? "other") === c.value).length})
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((img, i) => (
          <button
            key={`${img.url}-${i}`}
            type="button"
            onClick={() => setOpenAt(i)}
            aria-label={`View photo ${i + 1}`}
            className="group relative aspect-square overflow-hidden rounded-xl2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Image
              src={img.url}
              alt={img.alt || `${alt} — photo ${i + 1}`}
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
    </div>
  );
}
