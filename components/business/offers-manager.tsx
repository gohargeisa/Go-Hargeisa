"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Pencil, Trash2, Tag } from "lucide-react";
import { createOffer, updateOffer, deleteOffer, toggleOfferActive, type OfferInput } from "@/lib/actions/business";
import type { BusinessOffer } from "@/types";

const EMPTY_DRAFT: OfferInput = {
  title: "",
  description: "",
  discountLabel: "",
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
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startCreate() {
    setDraft(EMPTY_DRAFT);
    setError(null);
    setEditingId("new");
  }

  function startEdit(offer: BusinessOffer) {
    setDraft({
      title: offer.title,
      description: offer.description ?? "",
      discountLabel: offer.discountLabel ?? "",
      startsAt: offer.startsAt ?? "",
      endsAt: offer.endsAt ?? "",
      isActive: offer.isActive,
    });
    setError(null);
    setEditingId(offer.id);
  }

  function onSave() {
    setError(null);
    startTransition(async () => {
      const result =
        editingId === "new"
          ? await createOffer(listingType, listingId, draft, [revalidatePath])
          : await updateOffer(editingId!, listingType, listingId, draft, [revalidatePath]);
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
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Plus size={15} aria-hidden="true" /> {t("addOfferButton")}
        </button>
      )}

      {editingId !== null && (
        <div className="space-y-4 rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
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
              <label className="mb-1.5 block text-sm font-semibold">{t("offerDiscountLabel")}</label>
              <input
                value={draft.discountLabel}
                onChange={(e) => setDraft((d) => ({ ...d, discountLabel: e.target.value }))}
                className={inputClass}
                placeholder={t("offerDiscountPlaceholder")}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t("offerStartsLabel")}</label>
              <input
                type="date"
                value={draft.startsAt}
                onChange={(e) => setDraft((d) => ({ ...d, startsAt: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t("offerEndsLabel")}</label>
              <input
                type="date"
                value={draft.endsAt}
                onChange={(e) => setDraft((d) => ({ ...d, endsAt: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))} />
            {t("offerActiveLabel")}
          </label>

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
            return (
              <div
                key={offer.id}
                className="flex flex-col gap-3 rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{offer.title}</p>
                    {offer.discountLabel && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{offer.discountLabel}</span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        offer.isActive
                          ? "bg-secondary/10 text-secondary-700 dark:text-sand/70"
                          : "bg-ink/10 text-ink/50 dark:bg-white/10 dark:text-sand/50"
                      }`}
                    >
                      {offer.isActive ? t("offerActiveLabel") : t("offerInactiveLabel")}
                    </span>
                  </div>
                  {offer.description && <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{offer.description}</p>}
                  {(offer.startsAt || offer.endsAt) && (
                    <p className="mt-1 text-xs text-ink/45 dark:text-sand/45">
                      {offer.startsAt ?? "…"} – {offer.endsAt ?? "…"}
                    </p>
                  )}
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
