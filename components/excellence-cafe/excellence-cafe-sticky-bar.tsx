"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarCheck, ShoppingBag } from "lucide-react";
import { TableReservationButton } from "@/components/shared/table-reservation-button";
import { useCart } from "@/lib/cart/cart-context";

/**
 * Excellence Café — mobile-only persistent CTA (lg:hidden), shown once the
 * hero has scrolled past. Flips between "View cart" (non-empty cart) and
 * "Reserve a Table". Visibility is CSS-only (opacity/pointer-events), never
 * a conditional `return null`/unmount keyed on scroll position — an earlier
 * version of this exact component on The Village
 * (components/the-village/village-sticky-bar.tsx) unmounted on scroll and
 * destroyed the reservation modal's own open/closed state as a side effect;
 * see that file's header comment for the full root-cause writeup. Applying
 * that fix from the start here rather than reproducing the bug.
 */
export function ExcellenceCafeStickyBar({
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
  const t = useTranslations("excellenceCafe");
  const tc = useTranslations("cart");
  const cart = useCart();
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (cart.itemCount === 0 && !reservable) return null;

  return (
    <div
      aria-hidden={!pastHero}
      className={`fixed inset-x-4 z-chrome lg:hidden ${
        pastHero ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
      }`}
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
          label={t("heroBookTable")}
          icon={<CalendarCheck size={16} aria-hidden="true" />}
          className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-primary-700 px-5 py-3 text-sm font-bold text-white shadow-premium-lg transition-transform active:scale-[0.98]"
        />
      )}
    </div>
  );
}
