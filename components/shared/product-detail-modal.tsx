"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { X, Images as ImagesIcon, Minus, Plus } from "lucide-react";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import { Lightbox, type LightboxSlide } from "@/components/shared/lightbox";
import { AddToCartButton } from "@/components/shared/add-to-cart-button";
import { ProductImage } from "@/components/shared/product-image";
import { getValidAddonsForProduct } from "@/lib/cart/product-addons";
import { productCategoryLabel, productGenderLabel } from "@/lib/config/product-categories";
import { productLocalizedName, productLocalizedDescription } from "@/lib/utils/product-i18n";
import type { AddToCartBusiness } from "@/lib/cart/cart-context";
import type { Product, ProductAddon } from "@/types";

/**
 * Product detail as a centered dialog rather than a dedicated route — same
 * fixed-overlay/focus-trap/scroll-lock shape as BookingRequestModal, kept
 * lean per the Phase 4 plan ("view product details/gallery" as in-page
 * actions, not a new dynamic route). The product's own photos open in the
 * existing shared Lightbox for full-screen viewing. Quantity + add-ons +
 * Add to Cart live here (not a separate order form) — the universal cart
 * picks up whatever the shopper configures.
 */
export function ProductDetailModal({
  product,
  storeName,
  business,
  locale,
  onClose,
}: {
  product: Product;
  storeName: string;
  /** The parent business — carries its add-on vocabulary (e.g.
   * cafes.flower_addons), narrowed down to only this product's valid
   * add-ons via getValidAddonsForProduct() below, never offered as-is. */
  business: AddToCartBusiness;
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations("products");
  const tp = useTranslations("productOrder");
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);
  useScrollLock(true);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  function toggleAddon(id: string) {
    setSelectedAddonIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  // Only this product's own valid add-ons (e.g. flower add-ons on a flower
  // product) ever reach the checkbox list or the cart — never the
  // business's whole add-on vocabulary. See lib/cart/product-addons.ts.
  const validAddons = getValidAddonsForProduct(product, business);
  const selectedAddons: ProductAddon[] = validAddons.filter((a) => selectedAddonIds.includes(a.id));

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
        className="relative flex h-full w-full flex-col overflow-y-auto bg-white shadow-2xl dark:bg-ink sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/8 p-4 dark:border-white/10 sm:p-5">
          <p className="font-display text-lg font-extrabold tracking-tight">{name}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/5 transition-colors hover:bg-ink/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3.5 p-4 sm:p-5">
          {photos.length > 0 ? (
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="group relative block h-52 w-full overflow-hidden rounded-xl2 bg-ink/5 dark:bg-white/5 sm:h-60"
              aria-label={t("viewGallery")}
            >
              <Image src={photos[0].url} alt={name} fill sizes="(max-width: 639px) 100vw, 448px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              {photos.length > 1 && (
                <span className="absolute bottom-2.5 end-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white">
                  <ImagesIcon size={13} aria-hidden="true" /> {photos.length}
                </span>
              )}
            </button>
          ) : (
            <div className="relative h-52 w-full overflow-hidden rounded-xl2 bg-ink/5 dark:bg-white/5 sm:h-60">
              <ProductImage alt={name} sizes="(max-width: 639px) 100vw, 448px" />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {product.category && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary/15 dark:text-primary-300">
                {productCategoryLabel(product.category, locale)}
              </span>
            )}
            {product.gender && (
              <span className="rounded-full bg-ink/8 px-2.5 py-0.5 text-xs font-semibold text-ink/60 dark:bg-white/10 dark:text-sand/60">
                {productGenderLabel(product.gender, locale)}
              </span>
            )}
            {!product.isAvailable && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-400/15 dark:text-red-300">
                {t("unavailable")}
              </span>
            )}
          </div>

          {product.brand && <p className="text-sm font-semibold text-ink/70 dark:text-sand/70">{product.brand}</p>}

          <p className="font-display text-xl font-bold">
            {product.price != null ? `${product.price} ${product.currency}` : t("priceOnRequest")}
          </p>

          {description && <p className="text-sm leading-relaxed text-ink/75 dark:text-sand/75">{description}</p>}

          {product.isAvailable && product.price != null ? (
            <div className="space-y-3.5 border-t border-ink/8 pt-3.5 dark:border-white/10">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{tp("quantityLabel")}</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label={tp("decreaseQuantity")}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 transition-colors hover:border-primary hover:text-primary dark:border-white/20"
                  >
                    <Minus size={14} aria-hidden="true" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    aria-label={tp("increaseQuantity")}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 transition-colors hover:border-primary hover:text-primary dark:border-white/20"
                  >
                    <Plus size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {validAddons.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">{tp("addonsLabel")}</label>
                  <div className="space-y-2">
                    {validAddons.map((addon) => (
                      <label
                        key={addon.id}
                        className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-ink/12 px-3.5 py-2.5 text-sm dark:border-white/15"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedAddonIds.includes(addon.id)}
                            onChange={() => toggleAddon(addon.id)}
                            className="h-4 w-4 rounded border-ink/30 text-primary focus:ring-primary"
                          />
                          {addon.name}
                        </span>
                        <span className="text-ink/50 dark:text-sand/50">
                          {addon.price > 0 ? `+$${addon.price.toFixed(2)}` : tp("free")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <AddToCartButton
                business={business}
                product={{ productId: product.id, name: product.name, nameAr: product.nameAr, nameSo: product.nameSo, image: product.image, unitPrice: product.price }}
                quantity={quantity}
                selectedAddons={selectedAddons}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-700 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-800"
              />
            </div>
          ) : (
            <p className="text-xs text-ink/45 dark:text-sand/45">{t("askAboutProduct", { store: storeName })}</p>
          )}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox slides={slides} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onIndexChange={setLightboxIndex} />
      )}
    </div>
  );
}
