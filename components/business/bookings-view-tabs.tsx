"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { List, CalendarRange } from "lucide-react";
import { BookingsTable } from "@/components/business/bookings-table";
import { BookingCalendar } from "@/components/business/booking-calendar";
import type { Booking, HotelRoom } from "@/types";
import type { BlockedDate } from "@/lib/data/business";

export function BookingsViewTabs({
  hotelId,
  bookings,
  rooms,
  blockedDates,
  revalidatePath,
}: {
  hotelId: string;
  bookings: Booking[];
  rooms: HotelRoom[];
  blockedDates: BlockedDate[];
  revalidatePath: string;
}) {
  const t = useTranslations("businessDashboard");
  const [view, setView] = useState<"list" | "calendar">("list");

  return (
    <div>
      <div className="mb-5 inline-flex rounded-full border border-ink/10 p-1 dark:border-white/15">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            view === "list" ? "bg-primary text-white" : "text-ink/60 hover:text-primary dark:text-sand/60"
          }`}
        >
          <List size={13} /> {t("viewList")}
        </button>
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            view === "calendar" ? "bg-primary text-white" : "text-ink/60 hover:text-primary dark:text-sand/60"
          }`}
        >
          <CalendarRange size={13} /> {t("viewCalendar")}
        </button>
      </div>

      {view === "list" ? (
        <BookingsTable hotelId={hotelId} bookings={bookings} rooms={rooms} revalidatePath={revalidatePath} />
      ) : (
        <div className="rounded-2xl border border-ink/8 p-5 dark:border-white/10">
          <BookingCalendar hotelId={hotelId} rooms={rooms} bookings={bookings} blockedDates={blockedDates} revalidatePath={revalidatePath} />
        </div>
      )}
    </div>
  );
}
