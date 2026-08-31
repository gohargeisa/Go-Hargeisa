"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X, ShoppingBag, CheckCircle2 } from "lucide-react";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { createPurchaseRequest } from "@/lib/actions/purchase-requests";
import { localeConfig, type Locale } from "@/lib/i18n/config";

/**
 * Emaankoo "Start Your Order" modal — a clean, global-shopping buy-for-me
 * request form. Emaankoo-only (used nowhere else), so it uses the
 * `emaankooStorefront` i18n namespace for its own labels rather than the
 * shared `purchaseRequest` namespace.
 *
 * Rendered through a portal to <body>: the trigger button lives inside the
 * hero <section className="relative isolate …">, and `isolation: isolate`
 * opens a stacking context that traps any descendant — so an in-tree modal
 * (z-modal / 80) still paints *under* the fixed site header (z-50) and the
 * mobile bottom nav (z-chrome / 40), which are siblings of that section at
 * the root. Portalling to <body> lifts the modal out of that context, and
 * also stops the hero column's `text-center` (mobile) from cascading into
 * the form. `createPortal` here mirrors the same fix already used in
 * components/restaurants/village-menu-order-section.tsx.
 *
 * Data model: the `purchase_requests` table's `platform` column is a fixed
 * check-constrained set (shein | amazon | noon | iherb | alibaba | other).
 * The marketplace picker maps SHEIN/noon/Amazon straight onto it and sends
 * anything else (Temu, AliExpress, a custom "Other" store) as `other`, while
 * the human-readable choice is always written to `notes` as a
 * "Marketplace: …" line so the Emaankoo team sees exactly which store —
 * same pattern the form already uses to fold `Email:` into `notes` (there's
 * no email column). No schema change.
 *
 * `createPurchaseRequest` requires a signed-in user (the request is tracked
 * in the customer's dashboard). Logged-out visitors get a clear prompt to
 * sign in OR to send the same request straight to Emaankoo on WhatsApp,
 * which is always offered as an alternative at the bottom of the form.
 */

/** Marketplaces mapped onto the existing `platform` check constraint;
 *  `other` covers everything the column can't name (Temu, AliExpress, …). */
const MARKETPLACES = [
  { id: "shein", label: "SHEIN", platform: "shein" as const },
  { id: "noon", label: "noon", platform: "noon" as const },
  { id: "amazon", label: "Amazon", platform: "amazon" as const },
  { id: "temu", label: "Temu", platform: "other" as const },
  { id: "aliexpress", label: "AliExpress", platform: "other" as const },
];

function OrderRequestModal({
  listingId,
  locale,
  whatsapp,
  onClose,
}: {
  listingId: string;
  locale: Locale;
  whatsapp?: string;
  onClose: () => void;
}) {
  const t = useTranslations("emaankooStorefront");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);
  useScrollLock(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [sourceOther, setSourceOther] = useState("");
  const [url, setUrl] = useState("");
  const [product, setProduct] = useState("");
  const [delivery, setDelivery] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const options = [...MARKETPLACES, { id: "other", label: t("orderSourceOther"), platform: "other" as const }];
  const selectedOption = options.find((m) => m.id === source);
  const isOther = source === "other";
  const marketLabel = isOther ? sourceOther.trim() : selectedOption?.label ?? "";
  const platform = selectedOption?.platform ?? "other";

  const whatsappText = [
    t("orderWhatsappPrefill"),
    marketLabel && `🛒 ${marketLabel}`,
    product && `• ${product}`,
    url,
    details,
    delivery && `📍 ${delivery}`,
    name && `— ${name}`,
    phone,
  ]
    .filter(Boolean)
    .join("\n");
  const whatsappHref = whatsapp ? toWhatsAppHref(whatsapp, whatsappText) : undefined;

  function normalizeUrl() {
    const v = url.trim();
    if (v && !/\s/.test(v) && !/^https?:\/\//i.test(v)) setUrl(`https://${v}`);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsSignIn(false);

    if (!source) {
      setError(t("orderSourceRequiredError"));
      return;
    }
    if (isOther && !sourceOther.trim()) {
      setError(t("orderSourceOtherRequiredError"));
      return;
    }

    setSubmitting(true);
    const notes = [
      marketLabel && `Marketplace: ${marketLabel}`,
      email.trim() && `Email: ${email.trim()}`,
      details.trim(),
    ]
      .filter(Boolean)
      .join("\n");
    const result = await createPurchaseRequest({
      listingId,
      customerName: name,
      customerPhone: phone,
      productName: product,
      productUrl: url.trim() || undefined,
      platform,
      quantity: 1,
      deliveryLocation: delivery,
      notes: notes || undefined,
    });
    setSubmitting(false);
    if (result.ok) {
      setSubmitted(true);
      router.refresh();
      return;
    }
    if (/sign(ed)?\s*in/i.test(result.error)) {
      setNeedsSignIn(true);
      setError(t("orderSignInNote"));
    } else {
      setError(result.error || t("orderErrorGeneric"));
    }
  }

  const labelClass = "mb-1.5 block text-sm font-semibold text-ink dark:text-sand";
  const inputClass =
    "w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-white/15 dark:bg-white/[0.04] dark:text-sand dark:placeholder:text-sand/35";
  const req = <span className="text-red-600 dark:text-red-400" aria-hidden="true"> *</span>;

  const overlay = (
    <div
      dir={localeConfig[locale].dir}
      className="fixed inset-0 z-modal flex items-end justify-center p-3 sm:items-center sm:p-4"
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="em-order-title"
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-3xl bg-white text-start shadow-2xl dark:bg-ink sm:max-h-[88dvh] sm:max-w-lg"
      >
        {/* Header — fixed, never scrolls; title + close always reachable */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-ink/10 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] dark:border-white/10">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-700 dark:bg-primary/15 dark:text-primary-300">
              <ShoppingBag size={17} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p id="em-order-title" className="font-display text-lg font-extrabold tracking-tight">
                {t("primaryCta")}
              </p>
              {!submitted && <p className="mt-0.5 text-xs leading-snug text-ink/55 dark:text-sand/55">{t("orderIntro")}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tCommon("close")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/12 bg-ink/[0.04] text-ink/70 transition-colors hover:bg-ink/10 hover:text-ink dark:border-white/15 dark:bg-white/[0.06] dark:text-sand/70 dark:hover:bg-white/15"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body — starts at the top of the form */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {submitted ? (
            <div className="py-10 text-center">
              <CheckCircle2 size={44} className="mx-auto text-emerald-500" aria-hidden="true" />
              <p className="mt-4 font-display text-lg font-bold">{t("orderSuccessTitle")}</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink/60 dark:text-sand/60">{t("orderSuccessBody")}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 rounded-full bg-primary-700 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-800"
              >
                {tCommon("close")}
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="em-name" className={labelClass}>
                    {t("orderFieldName")}
                    {req}
                  </label>
                  <input
                    id="em-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("orderFieldNamePlaceholder")}
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="em-phone" className={labelClass}>
                    {t("orderFieldPhone")}
                    {req}
                  </label>
                  <input
                    id="em-phone"
                    required
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("orderFieldPhonePlaceholder")}
                    autoComplete="tel"
                    className={`${inputClass} text-start`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="em-email" className={labelClass}>
                  {t("orderFieldEmail")}{" "}
                  <span className="font-normal text-ink/40 dark:text-sand/40">({t("orderOptional")})</span>
                </label>
                <input
                  id="em-email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("orderFieldEmailPlaceholder")}
                  autoComplete="email"
                  className={`${inputClass} text-start`}
                />
              </div>

              {/* Where do you want to buy from? — premium marketplace picker */}
              <fieldset>
                <legend className={`${labelClass} w-full`}>
                  {t("orderFieldSource")}
                  {req}
                </legend>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {options.map((m) => (
                    <label key={m.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="em-source"
                        value={m.id}
                        checked={source === m.id}
                        onChange={() => setSource(m.id)}
                        className="peer sr-only"
                      />
                      <span className="flex h-full min-h-[2.75rem] items-center justify-center rounded-xl border border-ink/15 px-3 py-2.5 text-center text-sm font-semibold text-ink/70 transition-all hover:border-ink/35 peer-checked:border-primary peer-checked:bg-primary/[0.06] peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-1 dark:border-white/15 dark:text-sand/70 dark:hover:border-white/35 dark:peer-checked:bg-primary/[0.12] dark:peer-checked:text-sand">
                        {m.label}
                      </span>
                    </label>
                  ))}
                </div>
                {isOther && (
                  <div className="mt-3">
                    <label htmlFor="em-source-other" className={labelClass}>
                      {t("orderFieldSourceOtherLabel")}
                      {req}
                    </label>
                    <input
                      id="em-source-other"
                      autoFocus
                      value={sourceOther}
                      onChange={(e) => setSourceOther(e.target.value)}
                      placeholder={t("orderFieldSourceOtherPlaceholder")}
                      className={inputClass}
                    />
                  </div>
                )}
              </fieldset>

              <div>
                <label htmlFor="em-url" className={labelClass}>
                  {t("orderFieldUrl")}
                  {req}
                </label>
                <input
                  id="em-url"
                  required
                  type="url"
                  inputMode="url"
                  dir="ltr"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={normalizeUrl}
                  placeholder={t("orderFieldUrlPlaceholder")}
                  className={`${inputClass} text-start`}
                />
                <p className="mt-1 text-xs leading-snug text-ink/45 dark:text-sand/45">{t("orderFieldUrlHint")}</p>
              </div>

              <div>
                <label htmlFor="em-product" className={labelClass}>
                  {t("orderFieldProduct")}
                  {req}
                </label>
                <input
                  id="em-product"
                  required
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder={t("orderFieldProductPlaceholder")}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="em-delivery" className={labelClass}>
                  {t("orderFieldDelivery")}
                  {req}
                </label>
                <input
                  id="em-delivery"
                  required
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                  placeholder={t("orderFieldDeliveryPlaceholder")}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="em-details" className={labelClass}>
                  {t("orderFieldDetails")}{" "}
                  <span className="font-normal text-ink/40 dark:text-sand/40">({t("orderOptional")})</span>
                </label>
                <textarea
                  id="em-details"
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={t("orderFieldDetailsPlaceholder")}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <p className="text-xs text-ink/45 dark:text-sand/45">{t("orderRequiredNote")}</p>

              {error && (
                <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                  {needsSignIn && (
                    <Link href={`/${locale}/auth/login`} className="mt-1 inline-block font-semibold underline">
                      {t("orderSignIn")}
                    </Link>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-700 py-3.5 text-sm font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-[0.98] disabled:translate-y-0 disabled:opacity-60"
              >
                <ShoppingBag size={16} aria-hidden="true" />
                {submitting ? t("orderSubmitting") : t("orderSubmit")}
              </button>

              {whatsappHref && (
                <div className="border-t border-ink/8 pt-3.5 text-center dark:border-white/10">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#1FA855] transition-opacity hover:opacity-80"
                  >
                    <WhatsAppIcon size={16} aria-hidden="true" />
                    {t("orderWhatsappAlt")}
                  </a>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}

export function OrderRequestButton({
  listingId,
  locale,
  className,
  label,
  whatsapp,
}: {
  listingId: string;
  locale: Locale;
  className: string;
  label: string;
  whatsapp?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open && <OrderRequestModal listingId={listingId} locale={locale} whatsapp={whatsapp} onClose={() => setOpen(false)} />}
    </>
  );
}
