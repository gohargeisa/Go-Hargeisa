"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle2, ShoppingCart, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import { CartItemRow } from "@/components/shared/cart-item-row";
import { CheckoutForm } from "@/components/shared/checkout-form";
import type { Locale } from "@/lib/i18n/config";

/**
 * The universal cart, mounted once globally (app/[locale]/layout.tsx) and
 * opened from anywhere via useCart().openCart() — CartButton in the header,
 * or directly from an AddToCartButton flow. Three views in one dialog
 * (cart -> checkout -> confirmation) rather than three separate routes,
 * matching every other request flow in this app (TableReservationModal,
 * the old ProductOrderModal) being an in-page dialog, not a page navigation.
 */
export function CartDrawer({ locale }: { locale: Locale }) {
  const t = useTranslations("cart");
  const tp = useTranslations("productOrder");
  const cart = useCart();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, cart.isOpen);
  useScrollLock(cart.isOpen);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && cart.isOpen) cart.closeCart();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cart]);

  if (!cart.isOpen) return null;

  const title = cart.view === "checkout" ? t("checkout") : cart.view === "confirmation" ? tp("successTitle") : t("title");

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={cart.closeCart} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-ink sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-ink/8 px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] dark:border-white/10">
          <div className="flex items-center gap-2">
            {cart.view === "checkout" && (
              <button
                type="button"
                onClick={cart.backToCart}
                aria-label={t("backToCart")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-ink/5 dark:hover:bg-white/10"
              >
                <ArrowLeft size={16} aria-hidden="true" className="rtl:rotate-180" />
              </button>
            )}
            <div>
              <p className="font-display text-xl font-extrabold tracking-tight">{title}</p>
              {cart.view === "cart" && cart.cart.businessName && (
                <p className="mt-0.5 text-sm text-ink/60 dark:text-sand/60">{cart.cart.businessName}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={cart.closeCart}
            aria-label={t("close")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/5 transition-colors hover:bg-ink/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {cart.view === "confirmation" ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent-600">
                <CheckCircle2 size={34} aria-hidden="true" />
              </div>
              <p className="max-w-md text-sm leading-relaxed text-ink/60 dark:text-sand/60">{tp("successBody")}</p>
              {cart.lastOrderReference && (
                <p className="rounded-full bg-ink/5 px-4 py-1.5 text-xs font-bold tracking-wide dark:bg-white/10" dir="ltr">
                  {cart.lastOrderReference}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
                <Link
                  href={`/${locale}/dashboard?tab=orders`}
                  onClick={cart.closeCart}
                  className="inline-flex items-center justify-center rounded-full bg-primary-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
                >
                  {tp("trackInDashboard")}
                </Link>
                <button
                  type="button"
                  onClick={cart.closeCart}
                  className="inline-flex items-center justify-center rounded-full border border-ink/15 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
                >
                  {t("continueShopping")}
                </button>
              </div>
            </div>
          ) : cart.view === "checkout" ? (
            <CheckoutForm locale={locale} />
          ) : cart.cart.items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <ShoppingCart size={40} className="text-ink/20 dark:text-sand/20" aria-hidden="true" />
              <p className="font-semibold">{t("empty")}</p>
              <p className="text-sm text-ink/50 dark:text-sand/50">{t("emptyDescription")}</p>
              <button
                type="button"
                onClick={cart.closeCart}
                className="mt-1 inline-flex items-center justify-center rounded-full border border-ink/15 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
              >
                {t("continueShopping")}
              </button>
            </div>
          ) : (
            <div>
              <div className="divide-y divide-ink/8 dark:divide-white/10">
                {cart.cart.items.map((item) => (
                  <CartItemRow key={item.key} item={item} locale={locale} />
                ))}
              </div>
              <button
                type="button"
                onClick={cart.clearCart}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50 hover:text-red-500 dark:text-sand/50"
              >
                <Trash2 size={13} aria-hidden="true" /> {t("clearCart")}
              </button>
            </div>
          )}
        </div>

        {cart.view === "cart" && cart.cart.items.length > 0 && (
          <div className="border-t border-ink/8 p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] dark:border-white/10">
            <div className="mb-3 flex items-center justify-between text-sm font-bold">
              <span>{t("subtotal")}</span>
              <span>${cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cart.closeCart}
                className="flex-1 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
              >
                {t("continueShopping")}
              </button>
              <button
                type="button"
                onClick={cart.goToCheckout}
                className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-white hover:bg-primary-700"
              >
                {t("checkout")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
