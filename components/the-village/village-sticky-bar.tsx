"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarCheck, ShoppingBag } from "lucide-react";
import { TableReservationButton } from "@/components/shared/table-reservation-button";
import { useCart } from "@/lib/cart/cart-context";

/**
 * The Village Hargeisa — one mobile-only persistent CTA (lg:hidden), shown
 * after the hero scrolls past. It flips between the two real actions this
 * page supports: "View cart" while there are items in the cart, otherwise
 * "Reserve a Table" (only when the restaurant is actually reservable).
 * `position: fixed` + an explicit `bottom` offset positions it above the
 * fixed MobileBookingBar — same slot the previous Village menu section used
 * for its cart pill — same plain-fixed pattern MobileBookingBar itself
 * uses, no portal: this component is rendered as a sibling of
 * MobileBookingBar at the end of TheVillageExperience's tree, already
 * outside village-hero.tsx's `isolate` section, so unlike
 * TableReservationButton's own modal (which genuinely needs to portal out
 * of that hero on the small subset of triggers rendered inside it), there's
 * no stacking context here to escape. A previous version of this component
 * self-portaled to document.body "to be safe" despite that; wrapping an
 * *already*-triggerable button in a second, redundant portal layer is
 * removed here as the one structural difference this component had from
 * every other reservation trigger on the page.
 *
 * Visibility is CSS-only (opacity/pointer-events), not a conditional
 * `return null` keyed on scroll position: `pastHero` used to fully unmount
 * this component (and the `TableReservationButton` inside it, destroying
 * its own `open` state) every time scrollY dropped back under the 560px
 * threshold. `window.scrollTo`/anchor-driven scrolling, and residual scroll
 * events firing in the same tick a tap is processed, both fire this
 * component's own scroll listener — verified via direct fiber-level
 * invocation of the trigger button's onClick prop (bypassing touch/click
 * synthesis entirely): the handler runs with no thrown error, yet no dialog
 * ever appears, on both a local dev server and the live production URL,
 * meaning the state update was being lost to a remount, not a click that
 * never fired. A component should never destroy its own children's
 * transient UI state (a modal's open/closed flag) as a side effect of an
 * unrelated, rapidly-changing signal like scroll position — this keeps the
 * whole subtree mounted once it's relevant at all (reservable or a
 * non-empty cart) and only toggles visibility.
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
          label={t("heroReserve")}
          icon={<CalendarCheck size={16} aria-hidden="true" />}
          className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-primary-700 px-5 py-3 text-sm font-bold text-white shadow-premium-lg transition-transform active:scale-[0.98]"
        />
      )}
    </div>
  );
}
