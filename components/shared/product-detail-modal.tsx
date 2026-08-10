"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { X, Images as ImagesIcon } from "lucide-react";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import { Lightbox, type LightboxSlide } from "@/components/shared/lightbox";
import { productCategoryLabel, productGenderLabel } from "@/lib/config/product-categories";
import { productLocalizedName, productLocalizedDescription } from "@/lib/utils/product-i18n";
import type { Product } from "@/types";

/**
 * Product detail as a centered dialog rather than a dedicated route — same
 * fixed-overlay/focus-trap/scroll-lock shape as BookingRequestModal, kept
 * lean per the Phase 4 plan ("view product details/gallery" as in-page
 * actions, not a new dynamic route). The product's own photos open in the
 * existing shared Lightbox for full-screen viewing.
 */
export function ProductDetailModal({
  product,
  storeName,
  locale,
  onClose,
}: {
  product: Product;
  storeName: string;
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations("products");
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);
  useScrollLock(true);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && lightboxIndex === null) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, lightboxIndex]);

  const name = productLocalizedName(product, locale);
  const description = productLocalizedDescription(product, locale);
  const photos = [
    ...(product.image ? [{ url: product.image, alt: name }] : []),
    ...product.gallery.map((g) => ({ url: g.url, alt: g.alt || name })),
  ];
  const slides: LightboxSlide[] = photos.map((p) => ({ url: p.url, alt: p.alt }));

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={name}
        tabIndex={-1}
        className="relative flex h-full w-full flex-col overflow-y-auto bg-white shadow-2xl dark:bg-ink sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/8 p-5 dark:border-white/10 sm:p-6">
          <p className="font-display text-xl font-extrabold tracking-tight">{name}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/5 transition-colors hover:bg-ink/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {photos.length > 0 && (
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="group relative block aspect-square w-full overflow-hidden rounded-xl2 bg-ink/5 dark:bg-white/5"
              aria-label={t("viewGallery")}
            >
              <Image src={photos[0].url} alt={name} fill sizes="(max-width: 639px) 100vw, 512px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              {photos.length > 1 && (
                <span className="absolute bottom-2.5 end-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white">
                  <ImagesIcon size={13} aria-hidden="true" /> {photos.length}
                </span>
              )}
            </button>
          )}

          <div className="flex flex-wrap gap-2">
            {product.category && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary/15 dark:text-primary-300">
                {productCategoryLabel(product.category, locale)}
              </span>
            )}
            {product.gender && (
              <span className="rounded-full bg-ink/8 px-3 py-1 text-xs font-semibold text-ink/60 dark:bg-white/10 dark:text-sand/60">
                {productGenderLabel(product.gender, locale)}
              </span>
            )}
            {!product.isAvailable && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-400/15 dark:text-red-300">
                {t("unavailable")}
              </span>
            )}
          </div>

          {product.brand && <p className="text-sm font-semibold text-ink/70 dark:text-sand/70">{product.brand}</p>}

          <p className="font-display text-2xl font-bold">
            {product.price != null ? `${product.price} ${product.currency}` : t("priceOnRequest")}
          </p>

          {description && <p className="leading-relaxed text-ink/75 dark:text-sand/75">{description}</p>}

          <p className="text-xs text-ink/45 dark:text-sand/45">{t("askAboutProduct", { store: storeName })}</p>
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox slides={slides} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onIndexChange={setLightboxIndex} />
      )}
    </div>
  );
}
