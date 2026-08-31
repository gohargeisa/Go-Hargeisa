"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ProductDetailModal } from "@/components/shared/product-detail-modal";
import { ProductImage } from "@/components/shared/product-image";
import { useCart, type AddToCartBusiness } from "@/lib/cart/cart-context";
import { productLocalizedName, productLocalizedDescription } from "@/lib/utils/product-i18n";
import type { Product } from "@/types";

/**
 * The Village Hargeisa — "Signature Selection" strip. Shows ONLY the dishes
 * that have a genuine, Village-owned photograph (an upload under the
 * restaurant's own storage path — see the filter in the-village-experience
 * .tsx). Never stock imagery, never a placeholder. If fewer than 3 such
 * dishes exist the parent hides this section entirely rather than pad it.
 */
function fmtPrice(n: number) {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

export function VillageSignatureSelection({
  products,
  business,
  locale,
  storeName,
}: {
  products: Product[];
  business: AddToCartBusiness;
  locale: string;
  storeName: string;
}) {
  const t = useTranslations("theVillage");
  const tp = useTranslations("products");
  const [selected, setSelected] = useState<Product | null>(null);
  // Touch the cart context so this component participates in the same
  // provider tree the modal needs — no visual output of its own.
  useCart();

  if (products.length === 0) return null;

  return (
    <div>
      <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
        {products.map((product) => {
          const name = productLocalizedName(product, locale);
          const description = productLocalizedDescription(product, locale);
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => setSelected(product)}
              className="group min-w-[240px] text-start sm:min-w-0"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-ink/10 bg-ink/5 dark:border-white/10 dark:bg-white/5">
                {/* Parent only passes dishes that have a genuine Village
                    photo, but fall back to the shared clean "no photo"
                    placeholder rather than an empty tile if that ever
                    changes — never a broken-image icon. */}
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={name}
                    fill
                    sizes="(max-width: 639px) 70vw, (max-width: 1023px) 45vw, 30vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <ProductImage alt={name} sizes="(max-width: 639px) 70vw, (max-width: 1023px) 45vw, 30vw" />
                )}
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <h3 className="font-display text-[15px] font-semibold tracking-tight transition-colors group-hover:text-primary-700 dark:group-hover:text-primary-300">
                  {name}
                </h3>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-ink/70 dark:text-sand/70">
                  {product.price != null ? fmtPrice(product.price) : tp("priceOnRequest")}
                </span>
              </div>
              {description && (
                <p dir="auto" className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink/55 dark:text-sand/55">{description}</p>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <ProductDetailModal
          product={selected}
          storeName={storeName}
          business={business}
          locale={locale}
          layout="spacious"
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
