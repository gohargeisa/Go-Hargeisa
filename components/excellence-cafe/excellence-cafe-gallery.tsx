"use client";

import { BusinessPhotoGallery } from "@/components/shared/business-photo-gallery";
import { RESTAURANT_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { EXCELLENCE_CAFE_GALLERY } from "@/lib/config/excellence-cafe-photos";
import { humanizePhotoKey } from "@/lib/utils/humanize-photo-key";
import type { GalleryImage } from "@/types";

/**
 * Categorized, lazy-loaded gallery — direct reuse of the platform's shared
 * BusinessPhotoGallery + Lightbox (the same component every hotel/
 * restaurant/cafe detail page already uses), fed from the curated static
 * photo list in lib/config/excellence-cafe-photos.ts rather than a DB
 * `restaurant.gallery` column — same "curation lives in a checked-in config
 * file, not jsonb" approach as lib/config/the-village-photos.ts. No new
 * gallery UI needed.
 */
export function ExcellenceCafeGallery({ businessName }: { businessName: string }) {
  const images: GalleryImage[] = EXCELLENCE_CAFE_GALLERY.map((p) => ({
    url: p.src,
    alt: `${businessName} — ${humanizePhotoKey(p.key)}`,
    category: p.category,
  }));

  return <BusinessPhotoGallery images={images} alt={businessName} categories={RESTAURANT_GALLERY_CATEGORIES} tileAspectClassName="aspect-[4/5]" />;
}
