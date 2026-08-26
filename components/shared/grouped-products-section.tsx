"use client";

import { useState } from "react";
import { ProductCard } from "@/components/shared/product-card";
import { ProductDetailModal } from "@/components/shared/product-detail-modal";
import type { AddToCartBusiness } from "@/lib/cart/cart-context";
import type { Product } from "@/types";

/**
 * A full storefront/menu laid out as labeled sections (Hot Drinks, Tea,
 * Flowers & Bouquets, ...) rather than ProductsSection's flat filter-pill
 * grid — for a catalog large enough (Lavender: 118 items) that "organized
 * by category" means visible section headers, not just a filter chip.
 * Reuses the same ProductCard/ProductDetailModal/AddToCartButton as every
 * other product surface — one universal cart either way.
 */
export function GroupedProductsSection({
  groups,
  storeName,
  business,
  locale,
}: {
  groups: { label: string; items: Product[] }[];
  storeName: string;
  business: AddToCartBusiness;
  locale: string;
}) {
  const [selected, setSelected] = useState<Product | null>(null);

  const visibleGroups = groups
    .map((g) => ({ label: g.label, items: g.items.filter((p) => !p.isHidden) }))
    .filter((g) => g.items.length > 0);

  if (visibleGroups.length === 0) return null;

  return (
    <div className="space-y-10">
      {visibleGroups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-4 font-display text-lg font-bold text-ink dark:text-sand">{group.label}</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {group.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                business={business}
                locale={locale}
                onOpenDetails={() => setSelected(product)}
                variant="compact"
              />
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <ProductDetailModal product={selected} storeName={storeName} business={business} locale={locale} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
