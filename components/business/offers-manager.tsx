"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Pencil, Trash2, Tag, Ticket } from "lucide-react";
import { createOffer, updateOffer, deleteOffer, toggleOfferActive, type OfferInput } from "@/lib/actions/offers";
import { ImageUploader } from "@/components/shared/image-uploader";
import { getOfferLifecycleStatus, formatOfferDiscount } from "@/lib/utils/offer-status";
import type { BusinessOffer, OfferApprovalStatus, OfferLifecycleStatus } from "@/types";

const EMPTY_DRAFT: OfferInput = {
  title: "",
  description: "",
  discountType: "percentage",
  discountValue: undefined,
  couponCode: "",
  coverImage: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

export function OffersManager({
  listingType,
  listingId,
  offers,
  revalidatePath,
}: {
  listingType: "hotel" | "restaurant" | "cafe";
  listingId: string;
  offers: BusinessOffer[];
  revalidatePath: string;
}) {
  const t = useTranslations("businessDashboard");
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<OfferInput>(EMPTY_DRAFT);
  const [discountValueText, setDiscountValueText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const approvalBadgeClass: Record<OfferApprovalStatus, string> = {
    pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    approved: "bg-secondary/10 text-secondary-700 dark:text-sand/70",
    rejected: "bg-red-500/10 text-red-600",
  };
  const lifecycleBadgeClass: Record<OfferLifecycleStatus, string> = {
    inactive: "bg-ink/10 text-ink/50 dark:bg-white/10 dark:text-sand/50",
    scheduled: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    active: "bg-secondary/10 text-secondary-700 dark:text-sand/70",
    expired: "bg-ink/10 text-ink/40 dark:bg-white/10 dark:text-sand/40",
  };

  function startCreate() {
    setDraft(EMPTY_DRAFT);
    setDiscountValueText("");
    setError(null);
    setEditingId("new");
  }

  function startEdit(offer: BusinessOffer) {
    setDraft({
      title: offer.title,
      description: offer.description ?? "",
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      couponCode: offer.couponCode ?? "",
      coverImage: offer.coverImage ?? "",
      startsAt: offer.startsAt ?? "",
      endsAt: offer.endsAt ?? "",
      isActive: offer.isActive,
    });
    setDiscountValueText(offer.discountValue !== undefined ? String(offer.discountValue) : "");
    setError(null);
    setEditingId(offer.id);
  }

  function onSave() {
    setError(null);
    const parsedValue = discountValueText.trim() === "" ? undefined : Number(discountValueText);
    if (discountValueText.trim() !== "" && !Number.isFinite(parsedValue)) {
      setError(t("offerDiscountValueError"));
      return;
    }
    const payload: OfferInput = { ...draft, discountValue: parsedValue };

    startTransition(async () => {
      const result =
        editingId === "new"
          ? await createOffer(listingType, listingId, payload, [revalidatePath])
          : await updateOffer(editingId!, listingType, listingId, payload, [revalidatePath]);
      if (result.ok) setEditingId(null);
      else setError(result.error ?? t("somethingWentWrong"));
    });
  }

  function onToggle(offer: BusinessOffer) {
    setPendingId(offer.id);
    startTransition(async () => {
      await toggleOfferActive(offer.id, listingType, listingId, !offer.isActive, [revalidatePath]);
      setPendingId(null);
    });
  }

  function onDelete(offer: BusinessOffer) {
    if (!confirm(t("deleteOfferConfirm"))) return;
    setPendingId(offer.id);
    startTransition(async () => {
      await deleteOffer(offer.id, listingType, listingId, [revalidatePath]);
      setPendingId(null);
    });
  }

  const inputClass =
    "w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15";

  return (
    <div className="space-y-5">
      {editingId === null && (
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
        >
          <Plus size={15} aria-hidden="true" /> {t("addOfferButton")}
        </button>
      )}

      {editingId !== null && (
        <div className="space-y-4 rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
          <ImageUploader folder={`offers/${listingType}`} value={draft.coverImage ?? ""} onChange={(url) => setDraft((d) => ({ ...d, coverImage: url }))} label={t("offerCoverImageLabel")} />

          <div>
            <label className="mb-1.5 block text-sm font-semibold">{t("offerTitleLabel")}</label>
            <input required value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">{t("offerDescriptionLabel")}</label>
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t("offerDiscountTypeLabel")}</label>
              <div className="grid grid-cols-2 gap-2">
                {(["percentage", "fixed"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, discountType: type }))}
                    className={`rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                      draft.discountType === type
                        ? "border-primary bg-primary/8 text-primary-800"
                        : "border-ink/12 text-ink/60 hover:border-primary/40 dark:border-white/15 dark:text-sand/60"
                    }`}
                  >
                    {type === "percentage" ? t("offerDiscountPercentage") : t("offerDiscountFixed")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t("offerDiscountValueLabel")}</label>
              <input
                type="number"
                min={0}
                max={draft.discountType === "percentage" ? 100 : undefined}
                value={discountValueText}
                onChange={(e) => setDiscountValueText(e.target.value)}
                className={inputClass}
                placeholder={draft.discountType === "percentage" ? "20" : "15"}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t("offerCouponCodeLabel")}</label>
              <input
                value={draft.couponCode}
                onChange={(e) => setDraft((d) => ({ ...d, couponCode: e.target.value.toUpperCase() }))}
                className={inputClass}
                placeholder={t("offerCouponCodePlaceholder")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t("offerStartsLabel")}</label>
              <input type="date" value={draft.startsAt} onChange={(e) => setDraft((d) => ({ ...d, startsAt: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t("offerEndsLabel")}</label>
              <input type="date" value={draft.endsAt} onChange={(e) => setDraft((d) => ({ ...d, endsAt: e.target.value }))} className={inputClass} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))} />
            {t("offerActiveLabel")}
          </label>

          <p className="text-xs text-ink/45 dark:text-sand/45">{t("offerModerationHint")}</p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={isPending || !draft.title.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
            >
              {isPending && <Loader2 size={13} className="animate-spin" />} {t("saveChanges")}
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              disabled={isPending}
              className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold dark:border-white/20"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 p-12 text-center dark:border-white/15">
          <Tag size={26} className="text-ink/25" aria-hidden="true" />
          <p className="font-medium text-ink/60 dark:text-sand/60">{t("offersEmpty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => {
            const busy = isPending && pendingId === offer.id;
            const lifecycle = getOfferLifecycleStatus(offer);
            const discountLabel = formatOfferDiscount(offer);
            return (
              <div
                key={offer.id}
                className="flex flex-col gap-3 rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  {offer.coverImage && (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink/5 dark:bg-white/10">
                      <Image src={offer.coverImage} alt={offer.title} fill sizes="56px" className="object-cover" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{offer.title}</p>
                      {discountLabel && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary-800">{discountLabel}</span>
                      )}
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${approvalBadgeClass[offer.approvalStatus]}`}>
                        {t(`offerApproval_${offer.approvalStatus}` as "offerApproval_pending")}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${lifecycleBadgeClass[lifecycle]}`}>
                        {t(`offerLifecycle_${lifecycle}` as "offerLifecycle_active")}
                      </span>
                    </div>
                    {offer.description && <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{offer.description}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink/45 dark:text-sand/45">
                      {(offer.startsAt || offer.endsAt) && (
                        <span>
                          {offer.startsAt ?? "…"} – {offer.endsAt ?? "…"}
                        </span>
                      )}
                      {offer.couponCode && (
                        <span className="flex items-center gap-1">
                          <Ticket size={11} aria-hidden="true" /> {offer.couponCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggle(offer)}
                    disabled={busy}
                    className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary disabled:opacity-60 dark:border-white/20"
                  >
                    {offer.isActive ? t("deactivateAction") : t("activateAction")}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(offer)}
                    aria-label={t("editAction")}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink/60 hover:border-primary hover:text-primary dark:border-white/20 dark:text-sand/60"
                  >
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(offer)}
                    disabled={busy}
                    aria-label={t("deleteAction")}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink/60 hover:border-red-500 hover:text-red-500 disabled:opacity-60 dark:border-white/20 dark:text-sand/60"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
