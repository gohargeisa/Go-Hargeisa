"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { submitCartOrder } from "@/lib/actions/product-orders";
import { getCartTaxPreview, type CartTaxPreview } from "@/lib/actions/tax";
import { lineTotal, taxableLineAmount } from "@/lib/cart/types";
import { FLOWER_SPECIALTY_CATEGORIES } from "@/lib/config/product-categories";

const inputClass =
  "w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Universal checkout — the cart's own fields (name/phone/fulfillment/
 * delivery/recipient/occasion/card message/notes), same field set the old
 * per-listing ProductOrderForm had, now submitting the whole cart
 * (cart.items) in one submit_cart_order() call instead of one product per
 * request. Works identically for Restaurant/Cafe/Flower Shop/Perfume Shop —
 * whichever business the cart's items belong to.
 */
export function CheckoutForm({ locale }: { locale: string }) {
  const t = useTranslations("productOrder");
  const tCart = useTranslations("cart");
  const cart = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [occasion, setOccasion] = useState("");
  const [messageNote, setMessageNote] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [taxPreview, setTaxPreview] = useState<CartTaxPreview | null>(null);

  const deliveryEnabled = cart.cart.deliveryEnabled;
  const baseSubtotal = cart.cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const extrasTotal = cart.subtotal - baseSubtotal;

  // Preview only — a display convenience so the shopper sees the same tax
  // figure the order will actually be charged before submitting. The RPC
  // (submit_cart_order) independently re-resolves and re-calculates tax
  // server-side at order time; nothing computed here is sent to or trusted
  // by it. Re-fetches whenever the cart's taxable composition changes
  // (items/quantities/add-ons), not on every render.
  useEffect(() => {
    if (!cart.cart.listingType || !cart.cart.listingId || cart.cart.items.length === 0) {
      setTaxPreview(null);
      return;
    }
    let cancelled = false;
    getCartTaxPreview(
      cart.cart.listingType,
      cart.cart.listingId,
      cart.cart.items.map((i) => ({ productId: i.productId, category: i.category, taxableLineAmount: taxableLineAmount(i) }))
    ).then((preview) => {
      if (!cancelled) setTaxPreview(preview);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.cart.listingType, cart.cart.listingId, JSON.stringify(cart.cart.items)]);

  const grandTotal = cart.subtotal + (taxPreview?.totalAdjustment ?? 0);
  // Recipient/occasion/card-message only make sense for gift-oriented items
  // (flowers, cakes, gift sets, plants — the same FLOWER_SPECIALTY_CATEGORIES
  // list the addon/pricing system already uses, not a new taxonomy). A
  // restaurant food order or a makeup order has no "recipient" — showing
  // these fields there was exactly the "one generic ordering form for every
  // category" problem. A mixed cart (rare — one business selling both) shows
  // them if ANY line needs them, since it's still one order/one recipient.
  const hasGiftItem = cart.cart.items.some((i) => i.category && FLOWER_SPECIALTY_CATEGORIES.includes(i.category));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setError(t("errorRequired"));
      return;
    }
    if (deliveryEnabled && fulfillmentType === "delivery" && !deliveryAddress.trim()) {
      setError(t("errorDeliveryAddressRequired"));
      return;
    }
    if (cart.cart.items.length === 0 || !cart.cart.listingType || !cart.cart.listingId) {
      setError(t("errorCartEmpty"));
      return;
    }

    const idempotencyKey = cart.getOrderAttemptId();

    startTransition(async () => {
      const result = await submitCartOrder({
        listingType: cart.cart.listingType!,
        listingId: cart.cart.listingId!,
        idempotencyKey,
        items: cart.cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          addonIds: i.addons.map((a) => a.id),
          variantId: i.variantId,
          selectedOptions: i.selectedOptions?.map((o) => ({ key: o.key, value: o.value })),
        })),
        customerName,
        customerPhone,
        fulfillmentType: deliveryEnabled ? fulfillmentType : "pickup",
        deliveryAddress: deliveryAddress || undefined,
        preferredDate: preferredDate || undefined,
        preferredTime: hasGiftItem ? preferredTime || undefined : undefined,
        recipientName: recipientName || undefined,
        recipientPhone: recipientPhone || undefined,
        occasion: occasion || undefined,
        messageNote: messageNote || undefined,
        notes: notes || undefined,
        locale,
      });

      if (!result.ok) {
        setError(result.error || t("errorGeneric"));
        return;
      }

      cart.showConfirmation(result.orderReference);
      cart.clearCart();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-xl2 border border-ink/8 p-3.5 text-sm dark:border-white/10">
        {cart.cart.items.map((item) => (
          <div key={item.key} className="py-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-ink/70 dark:text-sand/70">
                {item.name}
                {item.variantName ? ` (${item.variantName})` : ""} × {item.quantity}
              </span>
              <span className="shrink-0 font-semibold">${lineTotal(item).toFixed(2)}</span>
            </div>
            {item.selectedOptions && item.selectedOptions.length > 0 && (
              <p className="truncate text-xs text-ink/50 dark:text-sand/50">
                {item.selectedOptions.map((o) => `${o.label}: ${o.valueLabel}`).join(" · ")}
              </p>
            )}
          </div>
        ))}
        <div className="mt-2 space-y-1 border-t border-ink/8 pt-2 text-sm dark:border-white/10">
          <div className="flex items-center justify-between text-ink/70 dark:text-sand/70">
            <span>{t("subtotalLabel")}</span>
            <span>${baseSubtotal.toFixed(2)}</span>
          </div>
          {extrasTotal > 0 && (
            <div className="flex items-center justify-between text-ink/70 dark:text-sand/70">
              <span>{t("extrasLabel")}</span>
              <span>${extrasTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-ink/70 dark:text-sand/70">
            <span>
              {taxPreview && taxPreview.taxAmount > 0
                ? t("taxLabel", { rate: (taxPreview.effectiveRate * 100).toFixed(taxPreview.effectiveRate * 100 % 1 === 0 ? 0 : 1) })
                : t("taxLabelZero")}
            </span>
            <span>${(taxPreview?.taxAmount ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-ink/8 pt-1.5 font-bold dark:border-white/10">
            <span>{t("totalLabel")}</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="checkout-name" className="sr-only">
          {t("nameLabel")}
        </label>
        <input
          id="checkout-name"
          required
          placeholder={t("nameLabel")}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="checkout-phone" className="sr-only">
          {t("phoneLabel")}
        </label>
        <input
          id="checkout-phone"
          required
          type="tel"
          placeholder={t("phoneLabel")}
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className={inputClass}
        />
      </div>

      {deliveryEnabled && (
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("fulfillmentLabel")}</label>
          <div className="grid grid-cols-2 gap-2">
            {(["pickup", "delivery"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFulfillmentType(type)}
                className={`rounded-xl border py-2.5 text-center text-sm font-semibold transition-colors ${
                  fulfillmentType === type
                    ? "border-primary bg-primary/8 text-primary-800"
                    : "border-ink/12 text-ink/60 hover:border-primary/40 dark:border-white/15 dark:text-sand/60"
                }`}
              >
                {type === "pickup" ? t("fulfillmentPickup") : t("fulfillmentDelivery")}
              </button>
            ))}
          </div>
        </div>
      )}

      {deliveryEnabled && fulfillmentType === "delivery" && (
        <div>
          <label htmlFor="checkout-address" className="sr-only">
            {t("deliveryAddressLabel")}
          </label>
          <input
            id="checkout-address"
            required
            placeholder={t("deliveryAddressLabel")}
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <div className={hasGiftItem ? "grid gap-3 sm:grid-cols-2" : undefined}>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("preferredDateLabel")}</label>
          <input type="date" min={todayIso()} value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} className={inputClass} />
        </div>
        {/* Delivery TIME — unlike the date, only meaningful for gift-oriented
            orders (a flower/cake needs a scheduled delivery window; a
            restaurant/cafe order doesn't). Same hasGiftItem gate as
            recipient/occasion/card-message below. */}
        {hasGiftItem && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("preferredTimeLabel")}</label>
            <input type="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className={inputClass} />
          </div>
        )}
      </div>

      {hasGiftItem && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder={t("recipientNameLabel")} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className={inputClass} />
            <input type="tel" placeholder={t("recipientPhoneLabel")} value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className={inputClass} />
          </div>

          <input placeholder={t("occasionLabel")} value={occasion} onChange={(e) => setOccasion(e.target.value)} className={inputClass} />

          <textarea rows={2} placeholder={t("messageNoteLabel")} value={messageNote} onChange={(e) => setMessageNote(e.target.value)} className={inputClass} />
        </>
      )}

      <textarea rows={2} placeholder={t("notesLabel")} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
      >
        {isPending && <Loader2 size={15} className="animate-spin" />}
        {isPending ? t("submitting") : tCart("placeOrder")}
      </button>
    </form>
  );
}
