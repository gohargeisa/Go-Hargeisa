import Image from "next/image";
import { BedDouble, Building2, Maximize, Users } from "lucide-react";
import { amenityIcon } from "@/lib/utils/amenity-icon";
import { HotelBookNowButton } from "@/components/shared/hotel-book-now-button";
import type { HotelBookingCta } from "@/lib/utils/booking-cta";
import type { Locale } from "@/lib/i18n/config";
import type { HotelRoom } from "@/types";

export function HotelRoomCard({
  room,
  allRooms,
  locale,
  hotelId,
  hotelName,
  hotelRating,
  bookingCta,
}: {
  room: HotelRoom;
  /** The hotel's full room list — the modal needs every option even when
   * launched from one specific room's card, so it can preselect that room
   * while still letting the guest switch to another. */
  allRooms: HotelRoom[];
  locale: Locale;
  hotelId: string;
  hotelName: string;
  hotelRating?: number;
  bookingCta: HotelBookingCta;
}) {
  const hasImage = Boolean(room.image);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-[0_6px_20px_rgba(20,30,45,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="relative h-48 shrink-0 overflow-hidden">
        {hasImage ? (
          <Image src={room.image!} alt={room.name} fill sizes="(max-width: 767px) 90vw, 340px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 dark:from-primary/20 dark:via-secondary/20 dark:to-white/5">
            <Building2 size={32} strokeWidth={1.5} className="text-primary/40" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <h3 className="font-display text-lg font-bold text-ink dark:text-white">{room.name}</h3>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink/60 dark:text-sand/60">
          {room.sizeSqm && (
            <span className="inline-flex items-center gap-1.5">
              <Maximize size={14} className="text-primary" aria-hidden="true" />
              {room.sizeSqm} m²
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} className="text-primary" aria-hidden="true" />
            {room.maxGuests} Guests
          </span>
          {room.bedType && (
            <span className="inline-flex items-center gap-1.5">
              <BedDouble size={14} className="text-primary" aria-hidden="true" />
              {room.bedType}
            </span>
          )}
        </div>

        {room.features.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {room.features.map((f) => {
              const Icon = amenityIcon(f);
              return (
                <li
                  key={f}
                  className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink/70 dark:bg-white/10 dark:text-sand/70"
                >
                  <Icon size={11} aria-hidden="true" />
                  {f}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink/8 pt-4 dark:border-white/10">
          <div>
            {room.pricePerNight ? (
              <p className="font-display text-xl font-bold text-primary">
                ${room.pricePerNight}
                <span className="ms-1 text-xs font-medium text-ink/50 dark:text-sand/50">/night</span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-ink/40 dark:text-sand/40">Contact for pricing</p>
            )}
          </div>

          <HotelBookNowButton
            cta={bookingCta}
            locale={locale}
            hotelId={hotelId}
            hotelName={hotelName}
            hotelRating={hotelRating}
            rooms={allRooms}
            preselectedRoomId={room.id}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-full bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            iconSize={13}
          />
        </div>
      </div>
    </div>
  );
}
