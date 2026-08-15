"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, MessageCircle, X } from "lucide-react";
import { updateReservationStatus } from "@/lib/actions/reservations";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { formatTime12h } from "@/lib/utils/opening-hours";
import type { TableReservation } from "@/types";

const STATUS_OPTIONS: TableReservation["status"][] = ["pending", "confirmed", "cancelled", "completed"];

const STATUS_STYLES: Record<TableReservation["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  confirmed: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  completed: "bg-secondary/15 text-secondary-700 dark:bg-white/10 dark:text-sand/70",
};

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Deterministic, not locale-dependent — toLocaleDateString(undefined, ...)
 * resolves against whatever locale the runtime defaults to, which isn't
 * guaranteed to match between server render and client hydration (caught
 * live during the production-readiness audit: the server rendered an
 * Arabic month name on the English dashboard, a real hydration mismatch).
 * Reservation dates always display the same way regardless of UI language,
 * matching formatTime12h's existing locale-independent convention below. */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTH_ABBR[m - 1]} ${d}, ${y}`;
}

/**
 * Same list-with-status-dropdown pattern as BookingsTable, generic over
 * listingType/listingId — this exact component drives Sultan's, Beydan's
 * (once enabled), and every future restaurant/cafe's owner-side reservation
 * management, no per-business code. updateReservationStatus re-checks
 * ownership itself (assertCanManageListing), so this component never has to
 * trust its own props for authorization.
 */
export function ReservationsTable({
  listingType,
  listingId,
  reservations,
  revalidatePath,
  variant = "table",
}: {
  listingType: "restaurant" | "cafe" | "service";
  listingId: string;
  reservations: TableReservation[];
  revalidatePath: string;
  /** "viewing" switches the guest-count column/WhatsApp message wording to
   * Real Estate's "viewers" instead of "guests" — see the customer-facing
   * TableReservationForm's identical variant prop. */
  variant?: "table" | "viewing";
}) {
  const t = useTranslations("businessDashboard");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const guestsLabel = variant === "viewing" ? t("viewers") : t("guests");

  function onStatusChange(reservation: TableReservation, status: TableReservation["status"]) {
    startTransition(async () => {
      await updateReservationStatus(reservation.id, listingType, listingId, status, [revalidatePath]);
      router.refresh();
    });
  }

  function contactHref(reservation: TableReservation): string {
    return toWhatsAppHref(
      reservation.customerPhone,
      variant === "viewing"
        ? `Hi ${reservation.customerName}, this is regarding your property viewing request (${reservation.reservationReference}).`
        : `Hi ${reservation.customerName}, this is regarding your table reservation (${reservation.reservationReference}).`
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 p-10 text-center dark:border-white/15">
        <p className="text-sm font-medium text-ink/55 dark:text-sand/55">{t("noReservationsYet")}</p>
        <p className="mt-1 text-xs text-ink/40 dark:text-sand/40">{t("noReservationsYetDescription")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-ink/8 dark:border-white/10 md:block">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] dark:bg-white/5">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">{t("reference")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("customerName")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("phone")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("reservationDate")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("reservationTime")}</th>
              <th className="px-4 py-3 text-start font-semibold">{guestsLabel}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("status")}</th>
              <th className="px-4 py-3 text-end font-semibold">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8 dark:divide-white/10">
            {reservations.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-mono text-xs text-ink/50 dark:text-sand/50">{r.reservationReference}</td>
                <td className="px-4 py-3 font-medium">{r.customerName}</td>
                <td className="px-4 py-3 text-ink/60 dark:text-sand/60">{r.customerPhone}</td>
                <td className="px-4 py-3 text-ink/60 dark:text-sand/60">{formatDate(r.reservationDate)}</td>
                <td className="px-4 py-3 text-ink/60 dark:text-sand/60">{formatTime12h(r.reservationTime.slice(0, 5))}</td>
                <td className="px-4 py-3 text-ink/60 dark:text-sand/60">{r.guestsCount}</td>
                <td className="px-4 py-3">
                  <select
                    value={r.status}
                    disabled={isPending}
                    onChange={(e) => onStatusChange(r, e.target.value as TableReservation["status"])}
                    className={`rounded-full border-0 px-2.5 py-1 text-xs font-bold capitalize outline-none ${STATUS_STYLES[r.status]}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {t(`bookingStatus_${s}`)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-end">
                  <div className="flex items-center justify-end gap-1.5">
                    {r.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onStatusChange(r, "confirmed")}
                          disabled={isPending}
                          aria-label={t("confirm")}
                          title={t("confirm")}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-accent-600 transition-colors hover:border-accent-600 dark:border-white/20"
                        >
                          <Check size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onStatusChange(r, "cancelled")}
                          disabled={isPending}
                          aria-label={t("reject")}
                          title={t("reject")}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-red-500 transition-colors hover:border-red-500 dark:border-white/20"
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </>
                    )}
                    <a
                      href={contactHref(r)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("contactGuest")}
                      title={t("contactGuest")}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-[#25D366] transition-colors hover:border-[#25D366] dark:border-white/20"
                    >
                      <MessageCircle size={14} aria-hidden="true" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {reservations.map((r) => (
          <div key={r.id} className="rounded-2xl border border-ink/8 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{r.customerName}</p>
                <p className="text-xs text-ink/50 dark:text-sand/50">{r.customerPhone}</p>
                <p className="font-mono text-[11px] text-ink/40 dark:text-sand/40">{r.reservationReference}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_STYLES[r.status]}`}>
                {t(`bookingStatus_${r.status}`)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs text-ink/60 dark:text-sand/60">
              <p>{formatDate(r.reservationDate)}</p>
              <p>{formatTime12h(r.reservationTime.slice(0, 5))}</p>
              <p className="col-span-2">
                {guestsLabel}: {r.guestsCount}
              </p>
              {r.notes && <p className="col-span-2">{t("notes")}: {r.notes}</p>}
            </div>
            <div className="mt-3 flex gap-2">
              {r.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => onStatusChange(r, "confirmed")}
                    disabled={isPending}
                    className="flex-1 rounded-full border border-accent-600/30 py-2 text-xs font-semibold text-accent-700 dark:text-accent-400"
                  >
                    {t("confirm")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onStatusChange(r, "cancelled")}
                    disabled={isPending}
                    className="flex-1 rounded-full border border-red-500/30 py-2 text-xs font-semibold text-red-500"
                  >
                    {t("reject")}
                  </button>
                </>
              )}
              <a
                href={contactHref(r)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-1 rounded-full border border-ink/15 py-2 text-xs font-semibold dark:border-white/20"
              >
                <MessageCircle size={13} aria-hidden="true" /> {t("contactGuest")}
              </a>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
