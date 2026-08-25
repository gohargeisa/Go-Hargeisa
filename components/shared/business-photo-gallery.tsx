"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { GalleryCategoryOption } from "@/lib/utils/gallery-categories";
import { Lightbox, type LightboxSlide } from "@/components/shared/lightbox";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import type { GalleryImage } from "@/types";

function pillClass(active: boolean) {
  return `shrink-0 snap-start whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
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
  whatsappHref,
  whatsappPromptText,
  whatsappButtonLabel,
}: {
  images: GalleryImage[];
  alt: string;
  categories: GalleryCategoryOption[];
  /** Opt-in, real-data-only: a wa.me link built by the caller (see
   * toWhatsAppHref) from the business's own WhatsApp number. Renders a
   * "Chat on WhatsApp" strip below the grid when set; omitted entirely
   * (default) for every existing caller, so hotels/restaurants/cafes render
   * byte-identical to before. */
  whatsappHref?: string;
  /** Required alongside `whatsappHref` — the already-translated prompt text
   * shown above the button (e.g. "See something you like? Chat with {name}
   * on WhatsApp to ask about it."). */
  whatsappPromptText?: string;
  /** Required alongside `whatsappHref` — the already-translated button label
   * (e.g. "WhatsApp"). */
  whatsappButtonLabel?: string;
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
        <div className="mb-5 flex snap-x snap-proximity gap-2 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap sm:overflow-visible sm:pb-0">
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

      {whatsappHref && whatsappPromptText && whatsappButtonLabel && (
        <div className="mt-6 flex flex-col items-center gap-2.5 text-center">
          <p className="max-w-md text-sm text-ink/65 dark:text-sand/65">{whatsappPromptText}</p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-[#1FB855] active:scale-95"
          >
            <WhatsAppIcon size={16} aria-hidden="true" />
            {whatsappButtonLabel}
          </a>
        </div>
      )}

      {openAt !== null && (
        <Lightbox slides={slides} index={openAt} onClose={() => setOpenAt(null)} onIndexChange={setOpenAt} />
      )}
    </div>
  );
}
