"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { AddToCartButton } from "@/components/shared/add-to-cart-button";
import { ProductImage } from "@/components/shared/product-image";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import { getValidAddonsForProduct } from "@/lib/cart/product-addons";
import { productCategoryLabel } from "@/lib/config/product-categories";
import { productLocalizedName } from "@/lib/utils/product-i18n";
import { getProductPricing } from "@/lib/utils/product-pricing";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import type { AddToCartBusiness } from "@/lib/cart/cart-context";
import type { Product, ProductVariant } from "@/types";

/**
 * Universal product tile — Restaurant dishes, Café menu items, Flower Shop
 * bouquets, Perfume Shop bottles, any future vertical. One component reused
 * by ProductsSection everywhere instead of a bespoke card per category.
 * Clicking the tile opens the full detail view (`onOpenDetails`); the Add to
 * Cart button is a quick-add that never triggers that navigation.
 */
export function ProductCard({
  product,
  business,
  locale,
  onOpenDetails,
  imageFallback,
  variant = "default",
  isWishlisted,
  onToggleWishlist,
  resolveSwatchColor,
}: {
  product: Product;
  business: AddToCartBusiness;
  locale: string;
  onOpenDetails: () => void;
  /** Passed straight through to ProductImage's own `fallback` — see its doc
   * comment. Omit for the default plain "no photo" icon. */
  imageFallback?: ReactNode;
  /** "default" (every existing caller, unchanged) is the compact square
   * cover-crop tile this component has always rendered. "premium" is
   * opt-in — a taller e-commerce-catalog tile: contain-fit image canvas
   * (nothing cropped), sale-price/discount-badge support driven by
   * `getProductPricing`, and an optional wishlist heart. Built for
   * Flormar's catalog but generic (no Flormar-specific markup), so any
   * future partner that wants this presentation can opt in the same way.
   * "compact" is opt-in — a shorter 4:3 cover-crop tile (not the tall
   * aspect-square + padded-canvas "premium" look) with a single-line name
   * and no separate category line, built for a dense, scannable food-menu
   * grid (The Village). Same quick-add/addon-routing/pricing logic as every
   * other variant — only the layout differs. */
  variant?: "default" | "premium" | "compact";
  /** premium variant only. Omit both to hide the wishlist heart entirely —
   * every caller that doesn't pass them keeps the exact same card it has
   * today. */
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  /** premium variant only, opt-in (every existing caller is unaffected):
   * when the product has variants, approximates a swatch color for ones
   * with no `hexColor` of its own — see ProductVariantSelector's identical
   * prop for why this exists (Flormar's real catalog has shade names but
   * no verified hex values). A variant that resolves to neither `hexColor`
   * nor this is simply skipped from the dot row rather than shown as a
   * blank/guessed color. */
  resolveSwatchColor?: (variant: ProductVariant) => string | null;
}) {
  const t = useTranslations("products");
  const name = productLocalizedName(product, locale);
  const validAddons = getValidAddonsForProduct(product, business);
  const hasVariants = (product.variants?.length ?? 0) > 0;
  const hasOptions = (product.options?.length ?? 0) > 0;
  // A variant product (e.g. a lipstick with 5 shades) or one with its own
  // configurable options (a cake's writing text, a latte's milk type) can
  // never quick-add straight from the grid — there is no shade/config to
  // attach to the cart line yet, and skipping it would silently drop what
  // the shopper actually wants. Routes to the same "View details" flow
  // addon-bearing products already use, where ProductDetailModal's
  // ProductVariantSelector/ProductOptionsForm collect it first.
  const canQuickAdd = product.isAvailable && product.price != null && validAddons.length === 0 && !hasVariants && !hasOptions;
  // Opt-in by data: only appears when the business has a real WhatsApp
  // number on file (AddToCartBusiness.whatsapp) AND this product has no
  // price — see toWhatsAppHref/AddToCartBusiness for why nothing is ever
  // hardcoded here.
  const showAskForPrice = product.isAvailable && product.price == null && !!business.whatsapp;
  const askForPriceHref = showAskForPrice
    ? toWhatsAppHref(business.whatsapp!, t("askForPriceMessage", { store: business.businessName, product: name }))
    : undefined;

  if (variant === "premium") {
    const pricing = getProductPricing(product);
    return (
      <div className="group flex h-full flex-col overflow-hidden rounded-xl2 border border-ink/8 bg-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]">
        <div className="relative aspect-square w-full shrink-0 overflow-hidden">
          <button
            type="button"
            onClick={onOpenDetails}
            aria-label={`${name} — ${t("viewDetails")}`}
            className="absolute inset-0 z-0 block text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ProductImage
              src={product.image}
              alt={name}
              sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
              className="object-contain transition-transform duration-500 group-hover:scale-[1.04]"
              fallback={imageFallback}
              fit="contain"
            />
          </button>
          {pricing.hasDiscount && (
            <span className="pointer-events-none absolute start-2.5 top-2.5 z-10 rounded-full bg-primary-800 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm">
              -{pricing.discountPercent}%
            </span>
          )}
          {!product.isAvailable && (
            <span className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-black/60 py-1 text-center text-xs font-bold text-white">
              {t("unavailable")}
            </span>
          )}
          {onToggleWishlist && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist();
              }}
              aria-label={isWishlisted ? t("removeFromWishlist") : t("addToWishlist")}
              aria-pressed={isWishlisted}
              className="absolute end-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-ink/50 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:text-primary-700 dark:bg-ink/85 dark:text-sand/60"
            >
              <Heart
                size={15}
                aria-hidden="true"
                fill={isWishlisted ? "currentColor" : "none"}
                className={isWishlisted ? "text-primary-700" : undefined}
              />
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3.5">
          <button type="button" onClick={onOpenDetails} className="block flex-1 text-start">
            <p className="line-clamp-2 text-sm font-semibold leading-snug">{name}</p>
            <p className="mt-0.5 text-xs text-ink/45 dark:text-sand/45">
              {product.category ? productCategoryLabel(product.category, locale) : ""}
            </p>
            {hasVariants &&
              (() => {
                const swatchVariants = product
                  .variants!.map((v) => ({ v, color: v.hexColor ?? resolveSwatchColor?.(v) ?? null }))
                  .filter((x) => x.color);
                if (swatchVariants.length === 0) return null;
                const shown = swatchVariants.slice(0, 4);
                const remaining = product.variants!.length - shown.length;
                return (
                  <div className="mt-1.5 flex items-center gap-1.5" aria-hidden="true">
                    <div className="flex items-center gap-1">
                      {shown.map(({ v, color }) => (
                        <span key={v.id} className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/20" style={{ backgroundColor: color! }} />
                      ))}
                    </div>
                    {/* A tasteful invitation, never a raw count ("+16") as
                       the primary shade UI — the parent button already
                       opens the full shade list via onOpenDetails. */}
                    {remaining > 0 && <span className="text-[11px] font-semibold text-ink/45 dark:text-sand/45">{t("viewShadesLabel")}</span>}
                  </div>
                );
              })()}
          </button>

          <div className="mt-2 flex items-baseline gap-1.5">
            {product.price != null ? (
              <>
                <span className="text-base font-bold text-ink dark:text-white">
                  {product.price.toFixed(2)} {product.currency}
                </span>
                {pricing.hasDiscount && (
                  <span className="text-xs font-medium text-ink/40 line-through dark:text-sand/40">
                    {pricing.originalPrice!.toFixed(2)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm font-semibold text-ink/50 dark:text-sand/50">{t("priceOnRequest")}</span>
            )}
          </div>

          <div className="mt-3">
            {canQuickAdd ? (
              <AddToCartButton
                business={business}
                product={{ productId: product.id, name: product.name, nameAr: product.nameAr, nameSo: product.nameSo, image: product.image, unitPrice: product.price!, category: product.category }}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary-700 py-2 text-xs font-bold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 active:scale-95"
              />
            ) : product.isAvailable && product.price != null ? (
              <button
                type="button"
                onClick={onOpenDetails}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-primary/30 py-2 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary/8 dark:text-primary-300"
              >
                <ShoppingCart size={13} aria-hidden="true" /> {t("viewDetails")}
              </button>
            ) : askForPriceHref ? (
              <a
                href={askForPriceHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#25D366] py-2 text-xs font-bold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-[#1FB855] active:scale-95"
              >
                <WhatsAppIcon size={14} aria-hidden="true" /> {t("askForPrice")}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-ink/8 bg-white transition-shadow duration-200 hover:shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
        <button
          type="button"
          onClick={onOpenDetails}
          aria-label={`${name} — ${t("viewDetails")}`}
          className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <ProductImage
            src={product.image}
            alt={name}
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            fallback={imageFallback}
          />
          {!product.isAvailable && (
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[11px] font-bold text-white">
              {t("unavailable")}
            </span>
          )}
        </button>

        <div className="flex flex-1 flex-col p-2.5">
          <button type="button" onClick={onOpenDetails} className="block flex-1 text-start">
            <p dir="auto" className="truncate text-[13px] font-semibold leading-snug">{name}</p>
            <p className="mt-0.5 text-[13px] font-bold text-ink dark:text-white">
              {product.price != null ? (
                <span dir="ltr">{`${product.price.toFixed(2)} ${product.currency}`}</span>
              ) : (
                t("priceOnRequest")
              )}
            </p>
          </button>

          <div className="mt-2">
            {canQuickAdd ? (
              <AddToCartButton
                business={business}
                product={{ productId: product.id, name: product.name, nameAr: product.nameAr, nameSo: product.nameSo, image: product.image, unitPrice: product.price!, category: product.category }}
                className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-primary-700 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-primary-800 active:scale-95"
              />
            ) : product.isAvailable && product.price != null ? (
              <button
                type="button"
                onClick={onOpenDetails}
                className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-primary/30 py-1.5 text-[11px] font-semibold text-primary-700 transition-colors hover:bg-primary/8 dark:text-primary-300"
              >
                <ShoppingCart size={11} aria-hidden="true" /> {t("viewDetails")}
              </button>
            ) : askForPriceHref ? (
              <a
                href={askForPriceHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-[#25D366] py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-[#1FB855] active:scale-95"
              >
                <WhatsAppIcon size={11} aria-hidden="true" /> {t("askForPrice")}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <button
        type="button"
        onClick={onOpenDetails}
        aria-label={`${name} — ${t("viewDetails")}`}
        className="relative block aspect-square w-full overflow-hidden rounded-xl2 bg-ink/5 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5"
      >
        <ProductImage
          src={product.image}
          alt={name}
          sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          fallback={imageFallback}
        />
        {product.isFeatured && (
          <span className="absolute start-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white">
            <Star size={13} aria-hidden="true" fill="currentColor" />
          </span>
        )}
        {!product.isAvailable && (
          <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs font-bold text-white">
            {t("unavailable")}
          </span>
        )}
      </button>
      <button type="button" onClick={onOpenDetails} className="mt-2 block w-full text-start">
        <p dir="auto" className="truncate text-sm font-semibold">{name}</p>
        <p className="text-xs text-ink/50 dark:text-sand/50">
          {product.category ? productCategoryLabel(product.category, locale) : ""}
          {product.price != null ? (
            <>{" • "}<span dir="ltr">{`${product.price} ${product.currency}`}</span></>
          ) : (
            ` • ${t("priceOnRequest")}`
          )}
        </p>
        {hasVariants &&
          (() => {
            // Same rule as the "premium" variant: a shade preview is a row of
            // small CIRCULAR color chips (verified hex, or an approximated
            // colour via resolveSwatchColor), never a photo thumbnail. When
            // no colour resolves for any shade, fall back to a plain count.
            const swatches = product
              .variants!.map((v) => ({ v, color: v.hexColor ?? resolveSwatchColor?.(v) ?? null }))
              .filter((x) => x.color);
            return (
              <span className="mt-1 flex items-center gap-1">
                {swatches.length > 0 ? (
                  <>
                    {swatches.slice(0, 4).map(({ v, color }) => (
                      <span
                        key={v.id}
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full ring-1 ring-inset ring-ink/10 dark:ring-white/20"
                        style={{ backgroundColor: color! }}
                      />
                    ))}
                    {product.variants!.length > swatches.slice(0, 4).length && (
                      <span className="text-[10px] font-semibold text-ink/45 dark:text-sand/45">{t("viewShadesLabel")}</span>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] font-semibold text-ink/40 dark:text-sand/40">
                    {t("optionsAvailable", { count: product.variants!.length })}
                  </span>
                )}
              </span>
            );
          })()}
      </button>
      {canQuickAdd ? (
        <AddToCartButton
          business={business}
          product={{ productId: product.id, name: product.name, nameAr: product.nameAr, nameSo: product.nameSo, image: product.image, unitPrice: product.price!, category: product.category }}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-primary/30 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary/8 dark:text-primary-300"
        />
      ) : product.isAvailable && product.price != null ? (
        <button
          type="button"
          onClick={onOpenDetails}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-primary/30 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary/8 dark:text-primary-300"
        >
          <ShoppingCart size={13} aria-hidden="true" /> {t("viewDetails")}
        </button>
      ) : askForPriceHref ? (
        <a
          href={askForPriceHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#25D366] py-1.5 text-xs font-bold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-[#1FB855] active:scale-95"
        >
          <WhatsAppIcon size={13} aria-hidden="true" /> {t("askForPrice")}
        </a>
      ) : null}
    </div>
  );
}
