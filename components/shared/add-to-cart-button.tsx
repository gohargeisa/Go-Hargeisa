"use client";

import { useRef, useState } from "react";
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
 * customer to checkout" rule). When rendered inside ProductDetailModal it
 * receives `onAdded`, which the modal wires to its own `onClose` so a
 * successful add drops the shopper straight back onto the menu/category they
 * were browsing (nothing unmounts, so their scroll position is intact).
 */
export function AddToCartButton({
  business,
  product,
  quantity = 1,
  selectedAddons = [],
  disabled = false,
  className,
  onAdded,
}: {
  business: AddToCartBusiness;
  product: AddToCartProduct;
  quantity?: number;
  selectedAddons?: ProductAddon[];
  /** Blocks adding — e.g. a required product option hasn't been filled in
   * yet. Purely additive: every existing caller that never passes this
   * keeps behaving exactly as before. */
  disabled?: boolean;
  className?: string;
  /** Called once the line has been added to the cart (or added via the
   * conflict "start a new order" path). Opt-in: grid quick-add callers omit
   * it and keep today's stay-on-page behavior; ProductDetailModal passes
   * `onClose` so the detail view closes itself after a successful add. */
  onAdded?: () => void;
}) {
  const t = useTranslations("products");
  const cart = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  // Guards against a rapid double-tap adding the same line twice: addItem is
  // synchronous, so a second tap landing in the same frame would otherwise
  // stack a duplicate. Cleared as soon as the (sync) add returns.
  const busyRef = useRef(false);

  function commitAdd() {
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
    onAdded?.();
  }

  function handleAdd() {
    if (busyRef.current || justAdded) return;
    busyRef.current = true;
    try {
      const result = cart.addItem(business, product, quantity, selectedAddons);
      if (result === "conflict") {
        setShowConflict(true);
        return;
      }
      commitAdd();
    } finally {
      busyRef.current = false;
    }
  }

  function handleConflictConfirm() {
    cart.clearAndAdd(business, product, quantity, selectedAddons);
    setShowConflict(false);
    commitAdd();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled}
        className={
          (className ??
            "inline-flex items-center justify-center gap-1.5 rounded-full bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 active:scale-95") +
          (disabled ? " cursor-not-allowed opacity-50 hover:translate-y-0" : "")
        }
      >
        {justAdded ? <Check size={15} aria-hidden="true" /> : <ShoppingCart size={15} aria-hidden="true" />}
        {justAdded ? t("addedToCart") : t("addToCart")}
      </button>
      {showConflict && <CartConflictDialog onConfirm={handleConflictConfirm} onCancel={() => setShowConflict(false)} />}
    </>
  );
}
