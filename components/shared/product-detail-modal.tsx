"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { X, Images as ImagesIcon, Minus, Plus, Heart } from "lucide-react";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import { useAndroidBackHandler } from "@/lib/hooks/use-android-back-handler";
import { useImageLoaded } from "@/lib/hooks/use-image-loaded";
import { Lightbox, type LightboxSlide } from "@/components/shared/lightbox";
import { AddToCartButton } from "@/components/shared/add-to-cart-button";
import { ProductImage } from "@/components/shared/product-image";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import { ProductVariantSelector } from "@/components/shared/product-variant-selector";
import { ProductOptionsForm } from "@/components/shared/product-options-form";
import { getValidAddonsForProduct } from "@/lib/cart/product-addons";
import { hasMissingRequiredOptions, resolveSelectedOptions, type ProductOptionValues } from "@/lib/cart/product-options";
import { productCategoryLabel, productGenderLabel } from "@/lib/config/product-categories";
import { productLocalizedName, productLocalizedDescription, variantLocalizedName } from "@/lib/utils/product-i18n";
import { getProductPricing } from "@/lib/utils/product-pricing";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import type { AddToCartBusiness } from "@/lib/cart/cart-context";
import type { Product, ProductAddon, ProductVariant } from "@/types";

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
  hideSku,
  variantLabel,
  resolveSwatchColor,
  resolveFallbackLabel,
  isWishlisted,
  onToggleWishlist,
  layout = "compact",
}: {
  product: Product;
  storeName: string;
  /** The parent business — carries its add-on vocabulary (e.g.
   * cafes.flower_addons), narrowed down to only this product's valid
   * add-ons via getValidAddonsForProduct() below, never offered as-is. */
  business: AddToCartBusiness;
  locale: string;
  onClose: () => void;
  /** Optional, opt-in only (every existing caller is unaffected): hides
   * the "SKU ..." line next to the price. Added for Flormar, where
   * customers should never see internal SKU/inventory identifiers. */
  hideSku?: boolean;
  /** Optional, opt-in only: passed to ProductVariantSelector as its `label`
   * — a domain noun for the swatch row ("Shade" for cosmetics) instead of
   * the generic "Choose an option". */
  variantLabel?: string;
  /** Passed straight through to ProductVariantSelector — see that
   * component's own doc comments for what each does. */
  resolveSwatchColor?: (variant: ProductVariant) => string | null;
  resolveFallbackLabel?: (variant: ProductVariant) => string;
  /** Optional, opt-in only (every existing caller is unaffected): renders a
   * wishlist heart next to the title, same on/off semantics as
   * ProductCard's identically-named props — omit both to keep today's
   * modal with no wishlist control at all. */
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  /** "compact" (every existing caller, unchanged) is today's single-column,
   * max-w-md dialog. "spacious" is opt-in — a wider, two-column desktop
   * layout (large image gallery left, details right; the header still
   * spans the full width above both) that stacks back to one column on
   * mobile. The whole dialog stays the single scroll container in both
   * modes (no independent inner scroll areas), so the bottom of the
   * content — including the Add to Cart button — is always reachable by
   * scrolling, never clipped. Added for Flormar's premium product detail
   * experience. */
  layout?: "compact" | "spacious";
}) {
  const t = useTranslations("products");
  const tp = useTranslations("productOrder");
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);
  useScrollLock(true);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [optionValues, setOptionValues] = useState<ProductOptionValues>({});
  // Data-driven variant support — absent entirely for the vast majority of
  // products (no `variants`), in which case everything below falls back to
  // the product's own image/price/name exactly as before variants existed.
  const hasVariants = (product.variants?.length ?? 0) > 0;
  // Default to the first IN-STOCK shade, not just the first by sort_order —
  // otherwise a product with real available shades opens looking
  // unorderable ("Out of stock", no Add to Cart) whenever its lowest-sorted
  // variant happens to be the one that's sold out. Confirmed against the
  // real Flormar catalog: 47 of 100 in-stock products with variants had
  // this exact mismatch (e.g. "Flormar Fne"'s default shade, "Tender Salmon
  // New", is out of stock while 15 other real shades are in stock). Falls
  // back to variants[0] only when every single shade is genuinely
  // unavailable, in which case "Out of stock" is the correct, honest state.
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    (product.variants?.find((v) => v.isAvailable) ?? product.variants?.[0])?.id
  );
  const activeVariant: ProductVariant | undefined = hasVariants
    ? (product.variants!.find((v) => v.id === selectedVariantId) ?? product.variants![0])
    : undefined;

  function toggleAddon(id: string) {
    setSelectedAddonIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  // Only this product's own valid add-ons (e.g. flower add-ons on a flower
  // product) ever reach the checkbox list or the cart — never the
  // business's whole add-on vocabulary. See lib/cart/product-addons.ts.
  const validAddons = getValidAddonsForProduct(product, business);
  const selectedAddons: ProductAddon[] = validAddons.filter((a) => selectedAddonIds.includes(a.id));
  const missingRequiredOptions = hasMissingRequiredOptions(product.options, optionValues);
  const selectedOptions = resolveSelectedOptions(product.options, optionValues, locale);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && lightboxIndex === null) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, lightboxIndex]);

  // Android hardware Back closes the modal — but not while its own photo
  // lightbox is open (the Lightbox registers its own handler on top of the
  // stack and closes first), mirroring the Escape guard above.
  useAndroidBackHandler(true, () => {
    if (lightboxIndex === null) onClose();
  });

  const name = productLocalizedName(product, locale);
  const description = productLocalizedDescription(product, locale);
  // Variant-specific image takes over the hero photo (with its own gallery
  // entry so the lightbox/photo-count badge stay correct); an unset
  // variant image falls back to the product's own — never a broken/blank
  // photo just because one shade never got a dedicated shot.
  const heroImage = activeVariant?.image || product.image;
  const photos = [
    ...(heroImage ? [{ url: heroImage, alt: name }] : []),
    ...product.gallery.filter((g) => g.url !== heroImage).map((g) => ({ url: g.url, alt: g.alt || name })),
  ];
  const slides: LightboxSlide[] = photos.map((p) => ({ url: p.url, alt: p.alt }));
  const displayPrice = activeVariant?.price ?? product.price;
  const isOrderable = (activeVariant ? activeVariant.isAvailable : product.isAvailable) && displayPrice != null;
  // Sale pricing only applies to the base product's own price — a variant
  // (e.g. "12 Burgundy" priced differently from "09 Rosewood") has no
  // discount math of its own, so this intentionally stays hidden once a
  // variant is selected rather than showing a stale/incorrect strikethrough.
  const pricing = activeVariant ? { hasDiscount: false } : getProductPricing(product);
  const showAskForPrice = !isOrderable && displayPrice == null && !!business.whatsapp;
  const askForPriceHref = showAskForPrice
    ? toWhatsAppHref(business.whatsapp!, t("askForPriceMessage", { store: storeName, product: name }))
    : undefined;

  const spacious = layout === "spacious";

  const imageBlock = (
    <>
      {photos.length > 0 ? (
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className={`group relative block w-full overflow-hidden rounded-xl2 bg-ink/5 dark:bg-white/5 ${
            spacious ? "h-[42vh] max-h-[420px] sm:h-auto sm:max-h-none sm:aspect-square" : "h-52 sm:h-60"
          }`}
          aria-label={t("viewGallery")}
        >
          <CrossfadeImage key={photos[0].url} src={photos[0].url} alt={name} />
          {photos.length > 1 && (
            <span className="absolute bottom-2.5 end-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white">
              <ImagesIcon size={13} aria-hidden="true" /> {photos.length}
            </span>
          )}
        </button>
      ) : (
        <div className={`relative w-full overflow-hidden rounded-xl2 bg-ink/5 dark:bg-white/5 ${spacious ? "h-[42vh] max-h-[420px] sm:h-auto sm:max-h-none sm:aspect-square" : "h-52 sm:h-60"}`}>
          <ProductImage alt={name} sizes={spacious ? "(max-width: 639px) 100vw, 50vw" : "(max-width: 639px) 100vw, 448px"} />
        </div>
      )}
      {/* Thumbnail strip — spacious layout only, and only when there's more
          than the one hero photo already shown above. Compact layout keeps
          today's "tap for lightbox" behavior with no separate strip. */}
      {spacious && photos.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {photos.map((photo, i) => (
            <button
              key={photo.url}
              type="button"
              onClick={() => setLightboxIndex(i)}
              aria-label={t("viewGallery")}
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-ink/10 dark:border-white/15"
            >
              <ImageWithFallback src={photo.url} alt={photo.alt} fill sizes="56px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </>
  );

  const detailsBlock = (
    <div className="space-y-3.5">
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
            {!isOrderable && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-400/15 dark:text-red-300">
                {activeVariant && !activeVariant.isAvailable ? t("outOfStock") : t("unavailable")}
              </span>
            )}
          </div>

          {product.brand && <p dir="auto" className="text-sm font-semibold text-ink/70 dark:text-sand/70">{product.brand}</p>}

          {/* Currency + amount are pinned LTR (`dir="ltr"` on each numeric
              span) so "7 USD" never visually reverses to "USD 7" on an
              Arabic RTL page; the localized "price on request" fallback keeps
              the ambient direction. */}
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-display text-xl font-bold transition-all duration-200">
            {displayPrice != null ? (
              <span dir="ltr">{`${displayPrice} ${product.currency}`}</span>
            ) : (
              <span>{t("priceOnRequest")}</span>
            )}
            {pricing.hasDiscount && (
              <span dir="ltr" className="font-body text-sm font-medium text-ink/40 line-through dark:text-sand/40">
                {product.originalPrice!.toFixed(2)} {product.currency}
              </span>
            )}
            {!hideSku && activeVariant?.sku && <span dir="ltr" className="ms-2 text-xs font-medium text-ink/40 dark:text-sand/40">SKU {activeVariant.sku}</span>}
          </p>

          {/* Real stock signal — opt-in to the "spacious" layout only, so
              every existing compact caller (café/restaurant/village menus)
              is byte-for-byte unchanged. For a product WITH shades the
              per-shade breakdown already sits in the variant selector's
              header, so this line only speaks for a simple, single-SKU
              product: an honest "In stock" / "Only N left" driven straight
              off `is_available` + `stock_quantity`. The negative case is
              already covered by the "Out of stock" badge above. */}
          {spacious && !hasVariants && isOrderable && (
            (() => {
              const low = product.stockQuantity != null && product.stockQuantity > 0 && product.stockQuantity <= 5;
              return (
                <p className={`flex items-center gap-1.5 text-sm font-semibold ${low ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${low ? "bg-amber-500" : "bg-emerald-500"}`} aria-hidden="true" />
                  {low ? t("lowStockLeft", { count: product.stockQuantity! }) : t("inStock")}
                </p>
              );
            })()
          )}

          {hasVariants && (
            <ProductVariantSelector
              variants={product.variants!}
              selectedId={activeVariant!.id}
              onSelect={(v) => setSelectedVariantId(v.id)}
              locale={locale}
              label={variantLabel}
              resolveSwatchColor={resolveSwatchColor}
              resolveFallbackLabel={resolveFallbackLabel}
            />
          )}

          {description && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-sand/50">{t("descriptionLabel")}</p>
              <p className="text-sm leading-relaxed text-ink/75 dark:text-sand/75">{description}</p>
            </div>
          )}

          {isOrderable ? (
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

              <ProductOptionsForm
                options={product.options}
                locale={locale}
                values={optionValues}
                onChange={(key, v) => setOptionValues((prev) => ({ ...prev, [key]: v }))}
              />

              <AddToCartButton
                business={business}
                product={{
                  productId: product.id,
                  name: product.name,
                  nameAr: product.nameAr,
                  nameSo: product.nameSo,
                  image: heroImage,
                  unitPrice: displayPrice!,
                  variantId: activeVariant?.id,
                  variantName: activeVariant ? variantLocalizedName(activeVariant, locale) : undefined,
                  variantSku: activeVariant?.sku,
                  category: product.category,
                  selectedOptions,
                }}
                quantity={quantity}
                selectedAddons={selectedAddons}
                disabled={missingRequiredOptions}
                onAdded={onClose}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-700 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-800"
              />
            </div>
          ) : askForPriceHref ? (
            <a
              href={askForPriceHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-bold text-white transition-colors hover:bg-[#1FB855]"
            >
              <WhatsAppIcon size={16} aria-hidden="true" /> {t("askForPrice")}
            </a>
          ) : (
            <p className="text-xs text-ink/45 dark:text-sand/45">{t("askAboutProduct", { store: storeName })}</p>
          )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={name}
        tabIndex={-1}
        className={`relative flex h-full w-full flex-col overflow-y-auto bg-white shadow-2xl dark:bg-ink sm:h-auto sm:rounded-3xl ${
          spacious ? "sm:max-h-[90vh] sm:max-w-3xl" : "sm:max-h-[85vh] sm:max-w-md"
        }`}
      >
        {/* Header spans the full dialog width in both layouts — close
            button stays reachable at a fixed, predictable spot regardless
            of how tall the two-column content below gets. */}
        <div className="flex items-start justify-between gap-3 border-b border-ink/8 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] dark:border-white/10 sm:p-5">
          {/* `dir="auto"` keeps an English product name left-to-right even
              inside an Arabic RTL modal; `text-balance` + `break-words`
              give long titles ("Lightweight Lip Powder Lipstick") even,
              natural line breaks instead of one orphaned word. min-w-0 lets
              it wrap rather than shove the action buttons off the edge. */}
          <p dir="auto" className="min-w-0 flex-1 text-balance break-words font-display text-lg font-extrabold leading-snug tracking-tight">
            {name}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {onToggleWishlist && (
              <button
                type="button"
                onClick={onToggleWishlist}
                aria-label={isWishlisted ? t("removeFromWishlist") : t("addToWishlist")}
                aria-pressed={isWishlisted}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 text-ink/60 transition-colors hover:bg-ink/10 dark:bg-white/10 dark:text-sand/60 dark:hover:bg-white/15"
              >
                <Heart size={16} aria-hidden="true" fill={isWishlisted ? "currentColor" : "none"} className={isWishlisted ? "text-primary-700" : undefined} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 transition-colors hover:bg-ink/10 dark:bg-white/10 dark:hover:bg-white/15"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Single scroll container either way (this outer dialog) — the
            two-column "spacious" layout never introduces a second,
            independently-scrolling area, so the Add to Cart button at the
            bottom of `detailsBlock` is always reachable by scrolling the
            whole dialog, never clipped inside a fixed-height column. */}
        {/* Bottom padding resolves the Android gesture bar / iOS home
            indicator via env(safe-area-inset-bottom) so the Add to Cart
            button at the end of `detailsBlock` is never tucked under system
            navigation when the dialog is scrolled to the bottom. */}
        {spacious ? (
          <div className="grid gap-6 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:grid-cols-2 sm:p-6 sm:pb-6">
            <div>{imageBlock}</div>
            {detailsBlock}
          </div>
        ) : (
          <div className="space-y-3.5 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-5 sm:pb-5">
            {imageBlock}
            {detailsBlock}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox slides={slides} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onIndexChange={setLightboxIndex} />
      )}
    </div>
  );
}

/** Fades the new photo in over the skeleton rather than popping instantly —
 * mounted fresh (via the caller's `key={src}`) every time the hero image
 * changes, e.g. on a shade switch, so each new variant photo gets its own
 * clean fade-in instead of jump-cutting to a different picture. */
function CrossfadeImage({ src, alt }: { src: string; alt: string }) {
  const { loaded, imgRef, onLoad } = useImageLoaded();
  const [errored, setErrored] = useState(false);

  if (errored) {
    // A dead product/gallery URL falls back to the same clean placeholder as
    // a missing photo — never the browser's broken-image glyph, and the
    // skeleton never gets stranded forever waiting for a load that fails.
    return <ProductImage alt={alt} sizes="(max-width: 639px) 100vw, 448px" />;
  }

  return (
    <>
      {!loaded && <div className="skeleton absolute inset-0" aria-hidden="true" />}
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 639px) 100vw, 448px"
        onLoad={onLoad}
        onError={() => setErrored(true)}
        className={`object-cover transition-opacity duration-300 ease-premium group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}
