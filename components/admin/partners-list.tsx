"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, ChevronDown, ChevronUp, Pencil, Megaphone, Ban, CircleCheck } from "lucide-react";
import {
  setPartnerStatus,
  assignSubscriptionPlan,
  setSubscriptionStatus,
  extendSubscription,
  addSubscriptionNote,
  extendTrial,
  expireTrialNow,
  setCustomPrice,
  setListingSuspended,
} from "@/lib/actions/partners";
import { ListingStatusMenu } from "@/components/shared/listing-status-menu";
import { FeatureListingButton } from "@/components/shared/feature-listing-button";
import { PinListingButton } from "@/components/shared/pin-listing-button";
import { DeleteListingButton } from "@/components/shared/delete-listing-button";
import { AssignedOwnerField, type AssignedOwner } from "@/components/admin/assigned-owner-field";
import { SUBSCRIPTION_PLAN_ORDER, SUBSCRIPTION_PLANS, type SubscriptionPlanId } from "@/lib/config/subscription-plans";
import type { QualityStatus } from "@/lib/validation/partner-quality";
import type { Locale } from "@/lib/i18n/config";
import type { OwnableListingType, SubscriptionStatus } from "@/types";

const TABLE_TO_LISTING_TYPE: Record<PartnerRow["table"], OwnableListingType> = {
  hotels: "hotel",
  restaurants: "restaurant",
  cafes: "cafe",
  city_services: "city_service",
  services: "service",
};

// Category-agnostic type label for the row header — every business category
// (hotels, restaurants, cafes, and every city_service/service category:
// florists, perfumeries, clinics, salons, ...) is one of these five tables,
// so this never needs a new case as categories are added.
const TABLE_LABEL: Record<PartnerRow["table"], string> = {
  hotels: "Hotel",
  restaurants: "Restaurant",
  cafes: "Cafe",
  city_services: "City Service",
  services: "Service",
};

// ListingStatusMenu (draft/published/archived) and DeleteListingButton are
// hardcoded to a stale table allowlist elsewhere (lib/actions/admin.ts,
// components/shared/delete-listing-button.tsx) that's never been kept in
// sync with which tables actually gained columns — that's a pre-existing
// inconsistency across the admin area, not something specific to partner
// management, and fixing it fully is out of scope here. city_services has
// its own dedicated edit route and delete path; services has neither yet.
const EDIT_HREF: Partial<Record<PartnerRow["table"], (locale: Locale, id: string) => string>> = {
  city_services: (locale, id) => `/${locale}/admin/city-services/${id}/edit`,
};

/** Wraps AssignedOwnerField with its own local state seeded from the row's
 * current owner — a fully separate, optional action from partner_status/
 * plan/suspend above it. Persists immediately via transferOwnership/
 * removeOwnership (see AssignedOwnerField), same as the hotel/restaurant/
 * cafe edit forms; nothing here is tied to Save/Add Partner at all. */
function PartnerOwnerField({ locale, table, id, owner }: { locale: Locale; table: PartnerRow["table"]; id: string; owner: AssignedOwner | null }) {
  const [value, setValue] = useState(owner);
  return (
    <AssignedOwnerField locale={locale} mode="edit" listingType={TABLE_TO_LISTING_TYPE[table]} listingId={id} value={value} onChange={setValue} />
  );
}

export interface PartnerNote {
  id: string;
  note: string;
  createdAt: string;
}

export interface PartnerRow {
  id: string;
  table: "hotels" | "restaurants" | "cafes" | "city_services" | "services";
  name: string;
  /** null = "No owner assigned" — a fully valid, expected state (see
   * PartnerOwnerField below). Assigning one is optional and separate from
   * everything else this row manages. */
  owner: AssignedOwner | null;
  partnerStatus: "trial" | "official";
  listingStatus: "draft" | "published" | "archived";
  featured: boolean;
  isPinned: boolean;
  isSuspended: boolean;
  trialExpiresAt: string | null;
  planTier: SubscriptionPlanId | null;
  subscriptionStatus: SubscriptionStatus;
  renewsAt: string | null;
  /** Overrides the plan tier's default price (lib/config/subscription-plans.ts) for this one partner. null = use the plan's standard price. */
  customPriceUsd: number | null;
  notes: PartnerNote[];
  /** Partner Production Quality System (lib/validation/partner-quality.ts) —
   * internal-only, never shown to customers, see the badge below. */
  qualityStatus: QualityStatus;
  qualityIssues: string[];
}

const STATUS_STYLE: Record<SubscriptionStatus, string> = {
  active: "bg-secondary/10 text-secondary-700 dark:text-sand/70",
  paused: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  cancelled: "bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-sand/60",
};

// Partner Production Quality System (lib/validation/partner-quality.ts) —
// internal-only signal, never rendered anywhere a customer can reach.
const QUALITY_STYLE: Record<QualityStatus, string> = {
  ready: "bg-secondary/10 text-secondary-700 dark:text-sand/70",
  needsReview: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  blocked: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
};
const QUALITY_LABEL_KEY: Record<QualityStatus, "qualityReady" | "qualityNeedsReview" | "qualityBlocked"> = {
  ready: "qualityReady",
  needsReview: "qualityNeedsReview",
  blocked: "qualityBlocked",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PartnersList({ locale, rows }: { locale: Locale; rows: PartnerRow[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [extendDate, setExtendDate] = useState("");
  const [trialExtendingId, setTrialExtendingId] = useState<string | null>(null);
  const [trialExtendDate, setTrialExtendDate] = useState("");
  const [notesOpenId, setNotesOpenId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [priceEditingId, setPriceEditingId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");

  function run(id: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setPendingId(id);
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
      setPendingId(null);
    });
  }

  function onToggleStatus(row: PartnerRow) {
    const next = row.partnerStatus === "official" ? "trial" : "official";
    run(row.id, () => setPartnerStatus(locale, row.table, row.id, next));
  }

  function onToggleSuspend(row: PartnerRow) {
    if (!row.isSuspended && !confirm(t("confirmSuspend", { name: row.name }))) return;
    run(row.id, () => setListingSuspended(locale, row.table, row.id, !row.isSuspended));
  }

  function onChangePlan(row: PartnerRow, plan: SubscriptionPlanId) {
    run(row.id, () => assignSubscriptionPlan(locale, row.table, row.id, plan));
  }

  function onStep(row: PartnerRow, direction: 1 | -1) {
    if (!row.planTier) return;
    const idx = SUBSCRIPTION_PLAN_ORDER.indexOf(row.planTier);
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= SUBSCRIPTION_PLAN_ORDER.length) return;
    onChangePlan(row, SUBSCRIPTION_PLAN_ORDER[nextIdx]);
  }

  function onSetStatus(row: PartnerRow, status: SubscriptionStatus) {
    run(row.id, () => setSubscriptionStatus(locale, row.table, row.id, status));
  }

  function onStartExtend(row: PartnerRow) {
    setExtendDate(row.renewsAt ?? todayIso());
    setExtendingId(row.id);
  }

  function onSaveExtend(row: PartnerRow) {
    if (!extendDate) return;
    setPendingId(row.id);
    startTransition(async () => {
      const result = await extendSubscription(locale, row.table, row.id, extendDate);
      if (result.ok) {
        router.refresh();
        setExtendingId(null);
      } else {
        alert(result.error ?? t("somethingWentWrong"));
      }
      setPendingId(null);
    });
  }

  function onStartTrialExtend(row: PartnerRow) {
    setTrialExtendDate(row.trialExpiresAt?.slice(0, 10) ?? todayIso());
    setTrialExtendingId(row.id);
  }

  function onSaveTrialExtend(row: PartnerRow) {
    if (!trialExtendDate) return;
    setPendingId(row.id);
    startTransition(async () => {
      const result = await extendTrial(locale, row.table, row.id, trialExtendDate);
      if (result.ok) {
        router.refresh();
        setTrialExtendingId(null);
      } else {
        alert(result.error ?? t("somethingWentWrong"));
      }
      setPendingId(null);
    });
  }

  function onExpireTrial(row: PartnerRow) {
    run(row.id, () => expireTrialNow(locale, row.table, row.id));
  }

  function onStartPriceEdit(row: PartnerRow) {
    const fallback = SUBSCRIPTION_PLANS[row.planTier ?? "basic"].priceUsd;
    setPriceDraft(String(row.customPriceUsd ?? fallback));
    setPriceEditingId(row.id);
  }

  function onSavePrice(row: PartnerRow) {
    const parsed = priceDraft.trim() === "" ? null : Number(priceDraft);
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) return;
    setPendingId(row.id);
    startTransition(async () => {
      const result = await setCustomPrice(locale, row.table, row.id, parsed);
      if (result.ok) {
        router.refresh();
        setPriceEditingId(null);
      } else {
        alert(result.error ?? t("somethingWentWrong"));
      }
      setPendingId(null);
    });
  }

  function onClearPrice(row: PartnerRow) {
    setPendingId(row.id);
    startTransition(async () => {
      const result = await setCustomPrice(locale, row.table, row.id, null);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
      setPendingId(null);
    });
  }

  function onAddNote(row: PartnerRow) {
    if (!noteDraft.trim()) return;
    setPendingId(row.id);
    startTransition(async () => {
      const result = await addSubscriptionNote(locale, row.table, row.id, noteDraft);
      if (result.ok) {
        router.refresh();
        setNoteDraft("");
      } else {
        alert(result.error ?? t("somethingWentWrong"));
      }
      setPendingId(null);
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-ink/15 p-10 text-center dark:border-white/15">
        <p className="font-semibold">{t("partnersEmptyTitle")}</p>
        <p className="mt-1.5 text-sm text-ink/50 dark:text-sand/50">{t("partnersEmptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => {
        const busy = isPending && pendingId === row.id;
        // A partner with no business_subscriptions row yet (planTier null)
        // still shows/uses the "basic" plan's price — matches the <select>
        // below, which already falls back to "basic" the same way.
        const plan = SUBSCRIPTION_PLANS[row.planTier ?? "basic"];
        const planIdx = row.planTier ? SUBSCRIPTION_PLAN_ORDER.indexOf(row.planTier) : -1;
        const notesOpen = notesOpenId === row.id;

        return (
          <div
            key={row.id}
            className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
          >
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-display font-semibold">{row.name}</p>
                <p className="text-xs text-ink/45 dark:text-sand/45">{TABLE_LABEL[row.table]}</p>
                <p className={`mt-0.5 flex items-center gap-1 text-[11px] font-medium ${row.partnerStatus === "official" ? "text-violet-600 dark:text-violet-400" : "text-ink/35 dark:text-sand/35"}`}>
                  <Megaphone size={11} aria-hidden="true" />
                  {row.partnerStatus === "official" ? t("socialEligibleLabel") : t("socialNotEligibleLabel")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    row.partnerStatus === "official"
                      ? "bg-accent/10 text-accent-700"
                      : "bg-secondary/10 text-secondary-700 dark:text-sand/70"
                  }`}
                >
                  {row.partnerStatus === "official" ? t("partnerStatusOfficial") : t("partnerStatusTrial")}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${QUALITY_STYLE[row.qualityStatus]}`}
                  title={row.qualityIssues.length > 0 ? row.qualityIssues.join(" ") : undefined}
                >
                  {t(QUALITY_LABEL_KEY[row.qualityStatus])}
                </span>
                {row.isSuspended && (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-400/15 dark:text-red-300">
                    {t("suspendedBadge")}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onToggleStatus(row)}
                  disabled={busy}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-ink/10 px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary disabled:opacity-60 dark:border-white/15"
                >
                  {busy && <Loader2 size={12} className="animate-spin" />}
                  {row.partnerStatus === "official" ? t("makeTrial") : t("makeOfficial")}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleSuspend(row)}
                  disabled={busy}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:opacity-60 ${
                    row.isSuspended
                      ? "border-accent/30 text-accent-700 hover:border-accent hover:bg-accent/5"
                      : "border-red-200 text-red-700 hover:border-red-400 hover:bg-red-50 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10"
                  }`}
                >
                  {busy ? <Loader2 size={12} className="animate-spin" /> : row.isSuspended ? <CircleCheck size={12} /> : <Ban size={12} />}
                  {row.isSuspended ? t("unsuspendAction") : t("suspendAction")}
                </button>
                <FeatureListingButton table={row.table} id={row.id} featured={row.featured} />
                <PinListingButton table={row.table} id={row.id} pinned={row.isPinned} />
                {row.table === "hotels" || row.table === "restaurants" || row.table === "cafes" ? (
                  <>
                    <ListingStatusMenu table={row.table} id={row.id} status={row.listingStatus} />
                    <DeleteListingButton table={row.table} id={row.id} name={row.name} />
                  </>
                ) : (
                  EDIT_HREF[row.table] && (
                    <a
                      href={EDIT_HREF[row.table]!(locale, row.id)}
                      className="flex h-8 items-center rounded-lg border border-ink/10 px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/15"
                    >
                      {t("editAction")}
                    </a>
                  )
                )}
              </div>
            </div>

            {/* Assigned owner — fully separate, optional action from
                everything above; "No owner assigned" is a normal, valid
                state (see PartnerOwnerField's own doc comment). */}
            <div className="mt-4 max-w-md">
              <PartnerOwnerField locale={locale} table={row.table} id={row.id} owner={row.owner} />
            </div>

            {/* Trial section */}
            {row.partnerStatus === "trial" && (
              <div className="mt-4 flex flex-col gap-3 rounded-xl2 border border-secondary/20 bg-secondary/5 p-4 dark:border-secondary/20 dark:bg-secondary/10 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-ink/55 dark:text-sand/55">
                  {trialExtendingId === row.id ? (
                    <>
                      <input
                        type="date"
                        value={trialExtendDate}
                        onChange={(e) => setTrialExtendDate(e.target.value)}
                        className="h-8 rounded-lg border border-ink/10 bg-transparent px-2 text-xs outline-none focus:border-primary dark:border-white/15"
                      />
                      <button
                        type="button"
                        onClick={() => onSaveTrialExtend(row)}
                        disabled={busy}
                        className="h-8 rounded-lg bg-primary px-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
                      >
                        {t("saveExtension")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrialExtendingId(null)}
                        disabled={busy}
                        className="h-8 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold dark:border-white/15"
                      >
                        {t("extendCancel")}
                      </button>
                    </>
                  ) : (
                    <>
                      <span>
                        {t("trialExpiresLabel")}:{" "}
                        {row.trialExpiresAt
                          ? new Date(row.trialExpiresAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : t("noTrialExpirySet")}
                      </span>
                      <button
                        type="button"
                        onClick={() => onStartTrialExtend(row)}
                        className="flex h-8 items-center gap-1 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/15"
                      >
                        <Pencil size={11} /> {t("extendTrialAction")}
                      </button>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onExpireTrial(row)}
                  disabled={busy}
                  className="h-8 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-500 disabled:opacity-60 dark:border-white/15"
                >
                  {t("expireTrialAction")}
                </button>
              </div>
            )}

            {/* Subscription section */}
            <div className="mt-4 flex flex-col gap-3 rounded-xl2 border border-ink/8 bg-ink/[0.015] p-4 dark:border-white/10 dark:bg-white/[0.02] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={row.planTier ?? "basic"}
                  onChange={(e) => onChangePlan(row, e.target.value as SubscriptionPlanId)}
                  disabled={busy}
                  aria-label={t("assignPlan")}
                  className="h-8 rounded-lg border border-ink/10 bg-transparent px-2 text-xs font-semibold outline-none focus:border-primary disabled:opacity-60 dark:border-white/15"
                >
                  {SUBSCRIPTION_PLAN_ORDER.map((id) => (
                    <option key={id} value={id}>
                      {SUBSCRIPTION_PLANS[id].name} — ${SUBSCRIPTION_PLANS[id].priceUsd}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => onStep(row, -1)}
                  disabled={busy || planIdx <= 0}
                  className="h-8 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary disabled:opacity-30 dark:border-white/15"
                >
                  {t("downgradePlan")}
                </button>
                <button
                  type="button"
                  onClick={() => onStep(row, 1)}
                  disabled={busy || planIdx === -1 || planIdx >= SUBSCRIPTION_PLAN_ORDER.length - 1}
                  className="h-8 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary disabled:opacity-30 dark:border-white/15"
                >
                  {t("upgradePlan")}
                </button>

                {priceEditingId === row.id ? (
                  <>
                    <div className="flex h-8 items-center gap-1 rounded-lg border border-ink/10 pl-2 text-xs dark:border-white/15">
                      <span className="text-ink/45 dark:text-sand/45">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceDraft}
                        onChange={(e) => setPriceDraft(e.target.value)}
                        placeholder={t("usePlanDefaultPlaceholder")}
                        className="h-full w-20 bg-transparent pr-2 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onSavePrice(row)}
                      disabled={busy}
                      className="h-8 rounded-lg bg-primary px-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
                    >
                      {t("savePriceAction")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceEditingId(null)}
                      disabled={busy}
                      className="h-8 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold dark:border-white/15"
                    >
                      {t("extendCancel")}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onStartPriceEdit(row)}
                      disabled={busy}
                      className="flex h-8 items-center gap-1 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary disabled:opacity-60 dark:border-white/15"
                    >
                      <Pencil size={11} />
                      ${row.customPriceUsd ?? plan.priceUsd}
                      {row.customPriceUsd !== null && <span className="text-ink/40 dark:text-sand/40">({t("customPriceTag")})</span>}
                    </button>
                    {row.customPriceUsd !== null && (
                      <button
                        type="button"
                        onClick={() => onClearPrice(row)}
                        disabled={busy}
                        className="h-8 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold text-ink/55 transition-colors hover:border-primary hover:text-primary disabled:opacity-60 dark:border-white/15 dark:text-sand/55"
                      >
                        {t("clearCustomPriceAction")}
                      </button>
                    )}
                  </>
                )}

                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[row.subscriptionStatus]}`}>
                  {t(`subscriptionStatus${row.subscriptionStatus[0].toUpperCase()}${row.subscriptionStatus.slice(1)}` as
                    | "subscriptionStatusActive"
                    | "subscriptionStatusPaused"
                    | "subscriptionStatusCancelled")}
                </span>

                {row.subscriptionStatus !== "active" && (
                  <button
                    type="button"
                    onClick={() => onSetStatus(row, "active")}
                    disabled={busy}
                    className="h-8 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-secondary-600 hover:text-secondary-700 disabled:opacity-60 dark:border-white/15"
                  >
                    {t("activateSubscription")}
                  </button>
                )}
                {row.subscriptionStatus !== "paused" && row.subscriptionStatus !== "cancelled" && (
                  <button
                    type="button"
                    onClick={() => onSetStatus(row, "paused")}
                    disabled={busy}
                    className="h-8 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-amber-500 hover:text-amber-600 disabled:opacity-60 dark:border-white/15"
                  >
                    {t("pauseSubscription")}
                  </button>
                )}
                {row.subscriptionStatus !== "cancelled" && (
                  <button
                    type="button"
                    onClick={() => onSetStatus(row, "cancelled")}
                    disabled={busy}
                    className="h-8 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-500 disabled:opacity-60 dark:border-white/15"
                  >
                    {t("cancelSubscription")}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-ink/55 dark:text-sand/55">
                {extendingId === row.id ? (
                  <>
                    <input
                      type="date"
                      value={extendDate}
                      onChange={(e) => setExtendDate(e.target.value)}
                      className="h-8 rounded-lg border border-ink/10 bg-transparent px-2 text-xs outline-none focus:border-primary dark:border-white/15"
                    />
                    <button
                      type="button"
                      onClick={() => onSaveExtend(row)}
                      disabled={busy}
                      className="h-8 rounded-lg bg-primary px-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
                    >
                      {t("saveExtension")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtendingId(null)}
                      disabled={busy}
                      className="h-8 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold dark:border-white/15"
                    >
                      {t("extendCancel")}
                    </button>
                  </>
                ) : (
                  <>
                    <span>
                      {t("renewsOnLabel")}:{" "}
                      {row.renewsAt
                        ? new Date(row.renewsAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : t("noRenewalSet")}
                    </span>
                    <button
                      type="button"
                      onClick={() => onStartExtend(row)}
                      className="flex h-8 items-center gap-1 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/15"
                    >
                      <Pencil size={11} /> {t("extendAction")}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Internal notes */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setNotesOpenId(notesOpen ? null : row.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-ink/55 hover:text-primary dark:text-sand/55"
              >
                {notesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {t("notesToggle")} ({row.notes.length})
              </button>

              {notesOpen && (
                <div className="mt-2.5 flex flex-col gap-2.5 border-s-2 border-ink/8 ps-3 dark:border-white/10">
                  {row.notes.length === 0 ? (
                    <p className="text-xs text-ink/40 dark:text-sand/40">{t("notesEmpty")}</p>
                  ) : (
                    row.notes.map((n) => (
                      <div key={n.id} className="text-xs">
                        <p className="text-ink/75 dark:text-sand/75">{n.note}</p>
                        <p className="mt-0.5 text-ink/35 dark:text-sand/35">
                          {new Date(n.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    ))
                  )}

                  <div className="mt-1 flex items-center gap-2">
                    <input
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder={t("addNotePlaceholder")}
                      className="h-8 flex-1 rounded-lg border border-ink/10 bg-transparent px-2.5 text-xs outline-none focus:border-primary dark:border-white/15"
                    />
                    <button
                      type="button"
                      onClick={() => onAddNote(row)}
                      disabled={busy || !noteDraft.trim()}
                      className="h-8 shrink-0 rounded-lg bg-primary px-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
                    >
                      {t("addNoteButton")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
