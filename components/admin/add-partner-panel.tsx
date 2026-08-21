"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus, X, Loader2 } from "lucide-react";
import { setPartnerStatus } from "@/lib/actions/partners";
import type { Locale } from "@/lib/i18n/config";
import type { OwnableListingType } from "@/types";

export interface UnclaimedListing {
  id: string;
  name: string;
  table: "hotels" | "restaurants" | "cafes" | "city_services" | "services";
  listingType: OwnableListingType;
}

const TYPE_LABEL: Record<OwnableListingType, string> = {
  hotel: "hotel",
  restaurant: "restaurant",
  cafe: "cafe",
  city_service: "city service",
  service: "service",
};

/**
 * "Add Partner" entry point for /admin/partners. A partner isn't its own
 * database row — it's an existing business listing, of ANY category, that
 * either has an owner OR has been explicitly promoted to Official (see
 * page.tsx's `.or("owner_id.not.is.null,partner_status.eq.official")`
 * filter, applied identically across hotels/restaurants/cafes/
 * city_services/services). Category-agnostic by construction: a florist, a
 * clinic, and a salon are just city_service/service rows like any other, so
 * nothing here special-cases a specific business or category.
 *
 * Owner assignment is deliberately NOT part of this flow — it's a fully
 * separate, optional action available afterward via PartnerOwnerField on
 * the row this creates (components/admin/partners-list.tsx). Adding a
 * partner here only ever calls the existing setPartnerStatus action (same
 * one the "Make Official"/"Make Trial" toggle below already uses) — no new
 * action, no owner_id write, no role change for any user.
 *
 * "Trial" isn't offered as a savable choice here: partner_status defaults
 * to 'trial' for every row already, so setting it to 'trial' with no owner
 * would be indistinguishable from an ordinary, never-touched listing —
 * there'd be nothing to verify actually happened. 'Official' is the one
 * value that's never set by accident, which is also what page.tsx's filter
 * uses to decide a row belongs here at all.
 *
 * Duplicates are structurally impossible: `candidates` only ever lists
 * listings with owner_id IS NULL AND partner_status = 'trial' (see
 * page.tsx), so a business drops off this list the moment it's added —
 * it can't be "added" twice, and an already-owned or already-official
 * listing never appears here since it's already shown below.
 */
export function AddPartnerPanel({
  locale,
  candidates,
}: {
  locale: Locale;
  candidates: UnclaimedListing[];
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selected = candidates.find((c) => c.id === selectedId) ?? null;

  function close() {
    setOpen(false);
    setSelectedId("");
    setError(null);
    setSaved(false);
  }

  function onSave() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await setPartnerStatus(locale, selected.table, selected.id, "official");
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
      >
        <Plus size={15} aria-hidden="true" /> {t("addPartnerAction")}
      </button>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/[0.03] p-5 dark:border-primary/25 dark:bg-primary/[0.06]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">{t("addPartnerTitle")}</h2>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("addPartnerDescription")}</p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={t("addPartnerCancel")}
          className="shrink-0 rounded-full p-1.5 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink/70 dark:text-sand/40 dark:hover:bg-white/10"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {candidates.length === 0 ? (
        <div className="mt-4 rounded-xl2 border border-dashed border-ink/15 p-5 text-sm text-ink/60 dark:border-white/15 dark:text-sand/60">
          <p>{t("addPartnerNoCandidates")}</p>
          <Link href={`/${locale}/admin/hotels/new`} className="mt-2 inline-block font-semibold text-primary hover:underline">
            {t("addPartnerCreateListingLink")}
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-medium">
            {t("addPartnerSelectLabel")}
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setError(null);
                setSaved(false);
              }}
              className="mt-1.5 block w-full max-w-md rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15 dark:bg-ink"
            >
              <option value="">{t("addPartnerSelectPlaceholder")}</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({TYPE_LABEL[c.listingType]})
                </option>
              ))}
            </select>
          </label>

          {selected && !saved && (
            <div className="max-w-md space-y-3">
              <p className="text-xs text-ink/55 dark:text-sand/55">{t("addPartnerNoOwnerNote")}</p>
              <button
                type="button"
                onClick={onSave}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
              >
                {isPending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                {t("addPartnerSaveAction", { name: selected.name })}
              </button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}

          {saved && <p className="text-sm font-medium text-secondary-700 dark:text-secondary-400">{t("addPartnerSavedHint")}</p>}
        </div>
      )}
    </div>
  );
}
