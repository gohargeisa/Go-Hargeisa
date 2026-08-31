"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { CalendarCheck, ShoppingBag } from "lucide-react";
import { TableReservationButton } from "@/components/shared/table-reservation-button";
import { useCart } from "@/lib/cart/cart-context";

/**
 * The Village Hargeisa — one mobile-only persistent CTA (lg:hidden), shown
 * after the hero scrolls past. It flips between the two real actions this
 * page supports: "View cart" while there are items in the cart, otherwise
 * "Reserve a Table" (only when the restaurant is actually reservable).
 * Portaled to <body> and positioned to clear the fixed MobileBookingBar —
 * same slot the previous Village menu section used for its cart pill.
 */
export function VillageStickyBar({
  listingId,
  businessName,
  reservable,
  locale,
}: {
  listingId: string;
  businessName: string;
  reservable: boolean;
  locale: string;
}) {
  const t = useTranslations("theVillage");
  const tc = useTranslations("cart");
  const cart = useCart();
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (typeof document === "undefined" || !pastHero) return null;
  if (cart.itemCount === 0 && !reservable) return null;

  return createPortal(
    <div
      className="fixed inset-x-4 z-chrome lg:hidden"
      style={{ bottom: "calc(4.75rem + 1.1rem + max(0.75rem, env(safe-area-inset-bottom)))" }}
    >
      {cart.itemCount > 0 ? (
        <button
          type="button"
          onClick={cart.openCart}
          className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-premium-lg transition-transform active:scale-[0.98] dark:bg-primary-700"
        >
          <ShoppingBag size={16} aria-hidden="true" />
          <span>
            {tc("viewCart")} • {tc("itemsCount", { count: cart.itemCount })} • {cart.subtotal.toFixed(2)} USD
          </span>
        </button>
      ) : (
        <TableReservationButton
          listingType="restaurant"
          listingId={listingId}
          businessName={businessName}
          locale={locale}
          label={t("heroReserve")}
          icon={<CalendarCheck size={16} aria-hidden="true" />}
          className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-primary-700 px-5 py-3 text-sm font-bold text-white shadow-premium-lg transition-transform active:scale-[0.98]"
        />
      )}
    </div>,
    document.body
  );
}
