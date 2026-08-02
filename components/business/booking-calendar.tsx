"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { blockRoomDate, unblockRoomDate } from "@/lib/actions/room-availability";
import type { Booking, HotelRoom } from "@/types";
import type { BlockedDate } from "@/lib/data/business";

const STATUS_DOT: Record<Booking["status"], string> = {
  pending: "bg-amber-400",
  confirmed: "bg-accent",
  cancelled: "bg-red-400",
  completed: "bg-secondary-400",
};

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthGrid(monthStart: Date): Date[] {
  const firstDayOfWeek = monthStart.getDay();
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - firstDayOfWeek);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function BookingCalendar({
  hotelId,
  rooms,
  bookings,
  blockedDates,
  revalidatePath,
}: {
  hotelId: string;
  rooms: HotelRoom[];
  bookings: Booking[];
  blockedDates: BlockedDate[];
  revalidatePath: string;
}) {
  const t = useTranslations("businessDashboard");
  const router = useRouter();
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [monthCursor, setMonthCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const roomBookings = useMemo(() => bookings.filter((b) => b.roomId === roomId && b.status !== "cancelled"), [bookings, roomId]);
  const roomBlocked = useMemo(() => new Map(blockedDates.filter((b) => b.roomId === roomId).map((b) => [b.date, b])), [blockedDates, roomId]);

  const days = useMemo(() => monthGrid(monthCursor), [monthCursor]);
  const todayIso = isoDate(new Date());

  function bookingFor(dateIso: string): Booking | undefined {
    return roomBookings.find((b) => dateIso >= b.checkIn && dateIso < b.checkOut);
  }

  function onDayClick(dateIso: string) {
    if (!roomId || dateIso < todayIso) return;
    const booking = bookingFor(dateIso);
    if (booking) return;

    setPendingDate(dateIso);
    startTransition(async () => {
      const isBlocked = roomBlocked.has(dateIso);
      const result = isBlocked
        ? await unblockRoomDate(roomId, hotelId, dateIso, [revalidatePath])
        : await blockRoomDate(roomId, hotelId, dateIso, undefined, [revalidatePath]);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
      setPendingDate(null);
    });
  }

  if (rooms.length === 0) {
    return <p className="text-sm text-ink/50 dark:text-sand/50">{t("calendarNoRooms")}</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="h-10 rounded-xl border border-ink/12 bg-transparent px-3 text-sm outline-none focus:border-primary dark:border-white/15"
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            aria-label={t("previousMonth")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/12 hover:border-primary hover:text-primary dark:border-white/15"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="w-32 text-center text-sm font-semibold">
            {monthCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            aria-label={t("nextMonth")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/12 hover:border-primary hover:text-primary dark:border-white/15"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-ink/55 dark:text-sand/55">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> {t("legendConfirmed")}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> {t("legendPending")}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ink/30 dark:bg-white/30" /> {t("legendBlocked")}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border border-ink/20 dark:border-white/20" /> {t("legendAvailable")}</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-ink/40 dark:text-sand/40">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateIso = isoDate(day);
          const inMonth = day.getMonth() === monthCursor.getMonth();
          const booking = bookingFor(dateIso);
          const blocked = roomBlocked.get(dateIso);
          const isPast = dateIso < todayIso;
          const busy = isPending && pendingDate === dateIso;

          return (
            <button
              key={dateIso}
              type="button"
              onClick={() => onDayClick(dateIso)}
              disabled={isPast || !!booking || busy}
              title={booking ? `${booking.guestName} (${booking.status})` : blocked?.note}
              className={`flex h-16 flex-col items-center justify-start gap-1 rounded-lg border p-1.5 text-xs transition-colors ${
                !inMonth
                  ? "border-transparent text-ink/20 dark:text-sand/20"
                  : isPast
                    ? "border-ink/5 text-ink/25 dark:border-white/5 dark:text-sand/25"
                    : booking
                      ? "cursor-not-allowed border-ink/10 dark:border-white/10"
                      : blocked
                        ? "border-ink/15 bg-ink/5 hover:border-red-400 dark:border-white/15 dark:bg-white/5"
                        : "border-ink/10 hover:border-primary dark:border-white/10"
              }`}
            >
              <span className="font-semibold">{day.getDate()}</span>
              {busy ? (
                <Loader2 size={11} className="animate-spin" />
              ) : booking ? (
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[booking.status]}`} />
              ) : blocked ? (
                <span className="h-1.5 w-1.5 rounded-full bg-ink/30 dark:bg-white/30" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
