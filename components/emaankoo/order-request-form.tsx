"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X, ShoppingBag } from "lucide-react";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import { ImageUploader } from "@/components/shared/image-uploader";
import { createPurchaseRequest, type CreatePurchaseRequestInput } from "@/lib/actions/purchase-requests";
import type { Locale } from "@/lib/i18n/config";

const PLATFORMS: CreatePurchaseRequestInput["platform"][] = ["shein", "amazon", "noon", "iherb", "alibaba", "other"];

function OrderRequestModal({ listingId, locale, onClose }: { listingId: string; locale: Locale; onClose: () => void }) {
  const t = useTranslations("purchaseRequest");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);
  useScrollLock(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [platform, setPlatform] = useState<CreatePurchaseRequestInput["platform"]>("shein");
  const [quantity, setQuantity] = useState("1");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [variant, setVariant] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await createPurchaseRequest({
      listingId,
      customerName: name,
      customerPhone: phone,
      productName,
      productUrl: productUrl || undefined,
      platform,
      quantity: Number(quantity) || 1,
      size: size || undefined,
      color: color || undefined,
      variant: variant || undefined,
      deliveryLocation,
      notes: notes || undefined,
      imageUrl: imageUrl || undefined,
    });
    setSubmitting(false);
    if (result.ok) {
      setSubmitted(true);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("modalTitle")}
        tabIndex={-1}
        className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-ink sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/8 px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] dark:border-white/10">
          <p className="font-display text-xl font-extrabold tracking-tight">{t("modalTitle")}</p>
          <button type="button" onClick={onClose} aria-label={tCommon("close")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/5 transition-colors hover:bg-ink/10 dark:bg-white/10 dark:hover:bg-white/15">
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {submitted ? (
            <div className="py-8 text-center">
              <p className="font-display text-lg font-bold">{t("submittedTitle")}</p>
              <p className="mt-2 text-sm text-ink/60 dark:text-sand/60">{t("submittedDescription")}</p>
              <button type="button" onClick={onClose} className="mt-5 rounded-full bg-primary-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-800">
                {tCommon("close")}
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3.5">
              <label className="block text-xs font-semibold">
                {t("customerName")}
                <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15" />
              </label>
              <label className="block text-xs font-semibold">
                {t("customerPhone")}
                <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+252 63 000 0000" className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15" />
              </label>
              <label className="block text-xs font-semibold">
                {t("productName")}
                <input required value={productName} onChange={(e) => setProductName(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15" />
              </label>
              <label className="block text-xs font-semibold">
                {t("platform")}
                <select value={platform} onChange={(e) => setPlatform(e.target.value as CreatePurchaseRequestInput["platform"])} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15">
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>{t(`platform_${p}`)}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold">
                {t("productUrlOptional")}
                <input type="url" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="https://…" className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15" />
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="block text-xs font-semibold">
                  {t("quantity")}
                  <input required type="number" min="1" max="50" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15" />
                </label>
                <label className="block text-xs font-semibold">
                  {t("sizeOptional")}
                  <input value={size} onChange={(e) => setSize(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15" />
                </label>
                <label className="block text-xs font-semibold">
                  {t("colorOptional")}
                  <input value={color} onChange={(e) => setColor(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15" />
                </label>
              </div>
              <label className="block text-xs font-semibold">
                {t("variantOptional")}
                <input value={variant} onChange={(e) => setVariant(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15" />
              </label>
              <label className="block text-xs font-semibold">
                {t("deliveryLocation")}
                <input required value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15" />
              </label>
              <label className="block text-xs font-semibold">
                {t("notesOptional")}
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15" />
              </label>
              <div>
                <p className="mb-1 text-xs font-semibold">{t("screenshotOptional")}</p>
                <ImageUploader folder="service-requests" value={imageUrl} onChange={setImageUrl} label={t("screenshotOptional")} rounded="rounded-xl2" />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-700 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-60">
                <ShoppingBag size={16} aria-hidden="true" />
                {submitting ? t("submitting") : t("submitRequest")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function OrderRequestButton({ listingId, locale, className, label }: { listingId: string; locale: Locale; className: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open && <OrderRequestModal listingId={listingId} locale={locale} onClose={() => setOpen(false)} />}
    </>
  );
}
