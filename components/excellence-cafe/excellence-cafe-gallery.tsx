"use client";

import { BusinessPhotoGallery } from "@/components/shared/business-photo-gallery";
import { RESTAURANT_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { EXCELLENCE_CAFE_GALLERY } from "@/lib/config/excellence-cafe-photos";
import { humanizePhotoKey } from "@/lib/utils/humanize-photo-key";
import type { GalleryImage } from "@/types";

/**
 * Categorized, lazy-loaded gallery — direct reuse of the platform's shared
 * BusinessPhotoGallery + Lightbox (the same component every hotel/
 * restaurant/cafe detail page already uses).
 *
 * Two sources, merged (never a parallel gallery system):
 *  1. `ownerUploads` — whatever the business owner / admin has added through
 *     the normal dashboard photo upload (the `restaurants.gallery` column).
 *     Shown FIRST because they are the most current, owner-approved photos.
 *  2. `EXCELLENCE_CAFE_GALLERY` — the curated static set from the owner's
 *     own supplied camera library (lib/config/excellence-cafe-photos.ts).
 *
 * De-duplicated by URL so a photo that exists in both never appears twice.
 * If the owner later uploads a full replacement set, this simply keeps
 * working — the curated fallback stays behind their uploads.
 */
export function ExcellenceCafeGallery({
  businessName,
  ownerUploads = [],
}: {
  businessName: string;
  ownerUploads?: GalleryImage[];
}) {
  const curated: GalleryImage[] = EXCELLENCE_CAFE_GALLERY.map((p) => ({
    url: p.src,
    alt: `${businessName} — ${humanizePhotoKey(p.key)}`,
    category: p.category,
  }));

  const seen = new Set<string>();
  const images: GalleryImage[] = [...ownerUploads, ...curated].filter((img) => {
    if (!img.url || seen.has(img.url)) return false;
    seen.add(img.url);
    return true;
  });

  return (
    <BusinessPhotoGallery
      images={images}
      alt={businessName}
      categories={RESTAURANT_GALLERY_CATEGORIES}
      tileAspectClassName="aspect-[4/5]"
    />
  );
}
