"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitProductOrder } from "@/lib/actions/product-orders";
import type { Product } from "@/types";

const inputClass =
  "w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Reusable product order/request form — generic over listingType/listingId,
 * same "request the business reviews" shape as TableReservationForm. Shows
 * the recipient/occasion/card-message fields (Flower Shops) alongside the
 * always-present delivery/pickup choice; a Perfume Shop customer just leaves
 * those optional fields blank. `products` is optional — when provided (and
 * non-empty) the customer can tie the request to a specific catalog item.
 */
export function ProductOrderForm({
  listingType,
  listingId,
  products = [],
  preselectedProductId,
  locale,
  onClose,
}: {
  listingType: "city_service" | "service";
  listingId: string;
  products?: Product[];
  preselectedProductId?: string;
  locale: string;
  onClose?: () => void;
}) {
  const t = useTranslations("productOrder");
  const [productId, setProductId] = useState(preselectedProductId ?? "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [occasion, setOccasion] = useState("");
  const [messageNote, setMessageNote] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setError(t("errorRequired"));
      return;
    }
    if (fulfillmentType === "delivery" && !deliveryAddress.trim()) {
      setError(t("errorDeliveryAddressRequired"));
      return;
    }

    startTransition(async () => {
      const result = await submitProductOrder({
        listingType,
        listingId,
        productId: productId || undefined,
        customerName,
        customerPhone,
        fulfillmentType,
        deliveryAddress: deliveryAddress || undefined,
        preferredDate: preferredDate || undefined,
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

      setReference(result.orderReference);
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent-600">
          <CheckCircle2 size={34} aria-hidden="true" />
        </div>
        <h3 className="font-display text-2xl font-bold">{t("successTitle")}</h3>
        <p className="max-w-md text-sm leading-relaxed text-ink/60 dark:text-sand/60">{t("successBody")}</p>
        {reference && (
          <p className="rounded-full bg-ink/5 px-4 py-1.5 text-xs font-bold tracking-wide dark:bg-white/10">{reference}</p>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-2 inline-flex items-center justify-center rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
          >
            {t("close")}
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 p-1">
      {products.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("modalTitle")}</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass}>
            <option value="">—</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="order-name" className="sr-only">
          {t("nameLabel")}
        </label>
        <input
          id="order-name"
          required
          placeholder={t("nameLabel")}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="order-phone" className="sr-only">
          {t("phoneLabel")}
        </label>
        <input
          id="order-phone"
          required
          type="tel"
          placeholder={t("phoneLabel")}
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className={inputClass}
        />
      </div>

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

      {fulfillmentType === "delivery" && (
        <div>
          <label htmlFor="order-address" className="sr-only">
            {t("deliveryAddressLabel")}
          </label>
          <input
            id="order-address"
            required
            placeholder={t("deliveryAddressLabel")}
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("preferredDateLabel")}</label>
        <input
          type="date"
          min={todayIso()}
          value={preferredDate}
          onChange={(e) => setPreferredDate(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          placeholder={t("recipientNameLabel")}
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          className={inputClass}
        />
        <input
          type="tel"
          placeholder={t("recipientPhoneLabel")}
          value={recipientPhone}
          onChange={(e) => setRecipientPhone(e.target.value)}
          className={inputClass}
        />
      </div>

      <input
        placeholder={t("occasionLabel")}
        value={occasion}
        onChange={(e) => setOccasion(e.target.value)}
        className={inputClass}
      />

      <textarea
        rows={2}
        placeholder={t("messageNoteLabel")}
        value={messageNote}
        onChange={(e) => setMessageNote(e.target.value)}
        className={inputClass}
      />

      <textarea
        rows={2}
        placeholder={t("notesLabel")}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className={inputClass}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
      >
        {isPending && <Loader2 size={15} className="animate-spin" />}
        {isPending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
