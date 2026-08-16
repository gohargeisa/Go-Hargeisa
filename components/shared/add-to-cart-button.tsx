"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ShoppingCart } from "lucide-react";
import { useCart, type AddToCartBusiness, type AddToCartProduct } from "@/lib/cart/cart-context";
import { CartConflictDialog } from "@/components/shared/cart-conflict-dialog";
import type { ProductAddon } from "@/types";

/**
 * Universal "Add to Cart" — used by ProductCard and ProductDetailModal alike
 * for every OrderableListingType. Never navigates to checkout; it only adds
 * the line and gives brief visual feedback, so the shopper stays on the page
 * and can keep browsing (the "Add to Cart must never immediately send the
 * customer to checkout" rule).
 */
export function AddToCartButton({
  business,
  product,
  quantity = 1,
  selectedAddons = [],
  className,
}: {
  business: AddToCartBusiness;
  product: AddToCartProduct;
  quantity?: number;
  selectedAddons?: ProductAddon[];
  className?: string;
}) {
  const t = useTranslations("products");
  const cart = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [showConflict, setShowConflict] = useState(false);

  function handleAdd() {
    const result = cart.addItem(business, product, quantity, selectedAddons);
    if (result === "conflict") {
      setShowConflict(true);
      return;
    }
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  }

  function handleConflictConfirm() {
    cart.clearAndAdd(business, product, quantity, selectedAddons);
    setShowConflict(false);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleAdd}
        className={
          className ??
          "inline-flex items-center justify-center gap-1.5 rounded-full bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 active:scale-95"
        }
      >
        {justAdded ? <Check size={15} aria-hidden="true" /> : <ShoppingCart size={15} aria-hidden="true" />}
        {justAdded ? t("addedToCart") : t("addToCart")}
      </button>
      {showConflict && <CartConflictDialog onConfirm={handleConflictConfirm} onCancel={() => setShowConflict(false)} />}
    </>
  );
}
