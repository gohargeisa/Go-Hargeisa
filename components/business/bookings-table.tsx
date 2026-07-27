"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Plus, X } from "lucide-react";
import { createBooking, updateBookingStatus, type BookingInput } from "@/lib/actions/business";
import type { Booking, HotelRoom } from "@/types";

const STATUS_OPTIONS: Booking["status"][] = ["pending", "confirmed", "cancelled", "completed"];

const STATUS_STYLES: Record<Booking["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  confirmed: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  completed: "bg-secondary/15 text-secondary-700 dark:bg-white/10 dark:text-sand/70",
};

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function BookingsTable({
  hotelId,
  bookings,
  rooms,
  revalidatePath,
}: {
  hotelId: string;
  bookings: Booking[];
  rooms: HotelRoom[];
  revalidatePath: string;
}) {
  const t = useTranslations("businessDashboard");
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<Booking | null>(null);
  const [isPending, startTransition] = useTransition();

  function onStatusChange(booking: Booking, status: Booking["status"]) {
    startTransition(async () => {
      await updateBookingStatus(booking.id, hotelId, status, [revalidatePath]);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">{t("bookingsTitle")}</h2>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Plus size={15} aria-hidden="true" /> {t("addBooking")}
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 p-10 text-center dark:border-white/15">
          <p className="text-sm font-medium text-ink/55 dark:text-sand/55">{t("noBookingsYet")}</p>
          <p className="mt-1 text-xs text-ink/40 dark:text-sand/40">{t("noBookingsYetDescription")}</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-ink/8 dark:border-white/10 md:block">
            <table className="w-full text-sm">
              <thead className="bg-ink/[0.03] dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">{t("guestName")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("room")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("guests")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("checkIn")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("checkOut")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("status")}</th>
                  <th className="px-4 py-3 text-end font-semibold">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8 dark:divide-white/10">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-medium">{b.guestName}</td>
                    <td className="px-4 py-3 text-ink/60 dark:text-sand/60">{b.roomName ?? "—"}</td>
                    <td className="px-4 py-3 text-ink/60 dark:text-sand/60">{b.guestsCount}</td>
                    <td className="px-4 py-3 text-ink/60 dark:text-sand/60">{formatDate(b.checkIn)}</td>
                    <td className="px-4 py-3 text-ink/60 dark:text-sand/60">{formatDate(b.checkOut)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={b.status}
                        disabled={isPending}
                        onChange={(e) => onStatusChange(b, e.target.value as Booking["status"])}
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-bold capitalize outline-none ${STATUS_STYLES[b.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {t(`bookingStatus_${s}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        type="button"
                        onClick={() => setViewing(b)}
                        className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
                      >
                        {t("view")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-ink/8 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{b.guestName}</p>
                    <p className="text-xs text-ink/50 dark:text-sand/50">{b.roomName ?? t("room")}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_STYLES[b.status]}`}
                  >
                    {t(`bookingStatus_${b.status}`)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs text-ink/60 dark:text-sand/60">
                  <p>
                    {t("guests")}: {b.guestsCount}
                  </p>
                  <p>{formatDate(b.checkIn)}</p>
                  <p className="col-span-2">
                    {t("checkOut")}: {formatDate(b.checkOut)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewing(b)}
                  className="mt-3 w-full rounded-full border border-ink/15 py-2 text-xs font-semibold dark:border-white/20"
                >
                  {t("view")}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <AddBookingModal hotelId={hotelId} rooms={rooms} revalidatePath={revalidatePath} onClose={() => setShowForm(false)} />
      )}
      {viewing && <BookingDetailModal booking={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-ink"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 dark:bg-white/10"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BookingDetailModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const t = useTranslations("businessDashboard");
  const rows: [string, string][] = [
    [t("guestName"), booking.guestName],
    [t("room"), booking.roomName ?? "—"],
    [t("guests"), String(booking.guestsCount)],
    [t("checkIn"), formatDate(booking.checkIn)],
    [t("checkOut"), formatDate(booking.checkOut)],
    [t("status"), t(`bookingStatus_${booking.status}`)],
  ];
  if (booking.guestPhone) rows.push([t("phone"), booking.guestPhone]);
  if (booking.guestEmail) rows.push(["Email", booking.guestEmail]);
  if (booking.notes) rows.push([t("notes"), booking.notes]);

  return (
    <ModalShell title={t("bookingDetails")} onClose={onClose}>
      <dl className="space-y-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 border-b border-ink/8 pb-2 dark:border-white/10">
            <dt className="text-ink/50 dark:text-sand/50">{label}</dt>
            <dd className="text-end font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </ModalShell>
  );
}

function AddBookingModal({
  hotelId,
  rooms,
  revalidatePath,
  onClose,
}: {
  hotelId: string;
  rooms: HotelRoom[];
  revalidatePath: string;
  onClose: () => void;
}) {
  const t = useTranslations("businessDashboard");
  const router = useRouter();
  const [form, setForm] = useState<BookingInput>({
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    guestsCount: 1,
    checkIn: "",
    checkOut: "",
    status: "pending",
    roomId: undefined,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof BookingInput>(key: K, value: BookingInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.guestName.trim() || !form.checkIn || !form.checkOut) {
      setError(t("bookingFormRequired"));
      return;
    }
    startTransition(async () => {
      const result = await createBooking(hotelId, form, [revalidatePath]);
      if (result.ok) {
        router.refresh();
        onClose();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  const inputClass =
    "w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15";

  return (
    <ModalShell title={t("addBooking")} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          required
          placeholder={t("guestName")}
          value={form.guestName}
          onChange={(e) => update("guestName", e.target.value)}
          className={inputClass}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder={t("phone")}
            value={form.guestPhone}
            onChange={(e) => update("guestPhone", e.target.value)}
            className={inputClass}
          />
          <input
            type="number"
            min={1}
            placeholder={t("guests")}
            value={form.guestsCount}
            onChange={(e) => update("guestsCount", Number(e.target.value) || 1)}
            className={inputClass}
          />
        </div>
        {rooms.length > 0 && (
          <select
            value={form.roomId ?? ""}
            onChange={(e) => update("roomId", e.target.value || undefined)}
            className={inputClass}
          >
            <option value="">{t("room")}</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("checkIn")}</label>
            <input
              required
              type="date"
              value={form.checkIn}
              onChange={(e) => update("checkIn", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("checkOut")}</label>
            <input
              required
              type="date"
              value={form.checkOut}
              onChange={(e) => update("checkOut", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <textarea
          placeholder={t("notes")}
          rows={2}
          value={form.notes ?? ""}
          onChange={(e) => update("notes", e.target.value)}
          className={inputClass}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {t("addBooking")}
        </button>
      </form>
    </ModalShell>
  );
}
