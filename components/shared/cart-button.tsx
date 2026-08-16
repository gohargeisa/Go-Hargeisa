"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart/cart-context";

/** Header cart trigger — icon + item-count badge, opens CartDrawer. One
 * instance mounted globally (site-header.tsx); works for every business,
 * not per-listing, since the cart itself is scoped to one business at a
 * time (see lib/cart/cart-context.tsx). Same scrolled-aware styling shape
 * as NotificationBell, its nearest header sibling. */
export function CartButton({ scrolled }: { scrolled: boolean }) {
  const t = useTranslations("cart");
  const cart = useCart();

  return (
    <button
      type="button"
      onClick={cart.openCart}
      aria-label={t("title")}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
        scrolled ? "text-gray-800 hover:bg-primary/10 dark:text-white/90" : "text-white hover:bg-white/10"
      }`}
    >
      <ShoppingCart size={19} aria-hidden="true" />
      {cart.itemCount > 0 && (
        <span className="absolute -end-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary-700 px-1 text-[10px] font-bold text-white">
          {cart.itemCount > 99 ? "99+" : cart.itemCount}
        </span>
      )}
    </button>
  );
}
