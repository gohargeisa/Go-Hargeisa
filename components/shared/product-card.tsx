"use client";

import { useTranslations } from "next-intl";
import { Star, ShoppingCart } from "lucide-react";
import { AddToCartButton } from "@/components/shared/add-to-cart-button";
import { ProductImage } from "@/components/shared/product-image";
import { getValidAddonsForProduct } from "@/lib/cart/product-addons";
import { productCategoryLabel } from "@/lib/config/product-categories";
import { productLocalizedName } from "@/lib/utils/product-i18n";
import type { AddToCartBusiness } from "@/lib/cart/cart-context";
import type { Product } from "@/types";

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
}: {
  product: Product;
  business: AddToCartBusiness;
  locale: string;
  onOpenDetails: () => void;
}) {
  const t = useTranslations("products");
  const name = productLocalizedName(product, locale);
  const validAddons = getValidAddonsForProduct(product, business);
  const canQuickAdd = product.isAvailable && product.price != null && validAddons.length === 0;

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
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="text-xs text-ink/50 dark:text-sand/50">
          {product.category ? productCategoryLabel(product.category, locale) : ""}
          {product.price != null ? ` • ${product.price} ${product.currency}` : ` • ${t("priceOnRequest")}`}
        </p>
      </button>
      {canQuickAdd ? (
        <AddToCartButton
          business={business}
          product={{ productId: product.id, name: product.name, nameAr: product.nameAr, nameSo: product.nameSo, image: product.image, unitPrice: product.price! }}
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
      ) : null}
    </div>
  );
}
