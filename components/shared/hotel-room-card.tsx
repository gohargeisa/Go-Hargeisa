import Image from "next/image";
import { useTranslations } from "next-intl";
import { BedDouble, Camera, Maximize, Users } from "lucide-react";
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
  /** Opt-in, larger presentation for the promoted "Rooms & Suites" showcase
   * (the room becomes the star of the page, not a card in a lower section)
   * — taller photo, no other layout change. Default (unset) keeps every
   * existing caller's compact card exactly as before. */
  size = "default",
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
  size?: "default" | "large";
}) {
  const th = useTranslations("hotelDetail");
  const hasImage = Boolean(room.image);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-[0_6px_20px_rgba(20,30,45,0.06)] transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(20,30,45,0.1)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className={`relative shrink-0 overflow-hidden ${size === "large" ? "h-64" : "h-48"}`}>
        {hasImage ? (
          <Image src={room.image!} alt={room.name} fill sizes="(max-width: 767px) 90vw, 420px" className="object-cover" />
        ) : (
          // Honest, explicit state — never a silent blank/generic box. No
          // verified per-room photography exists for this room; nothing is
          // invented or borrowed from another room/listing to fill the slot.
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 dark:from-primary/20 dark:via-secondary/20 dark:to-white/5">
            <Camera size={28} strokeWidth={1.5} className="text-primary/40" aria-hidden="true" />
            <span className="text-xs font-semibold text-primary/50">{th("roomPhotosComingSoon")}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <h3 className={`font-display font-bold text-ink dark:text-white ${size === "large" ? "text-xl" : "text-lg"}`}>{room.name}</h3>

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
              <p className="font-display text-xl font-bold text-primary-700">
                ${room.pricePerNight}
                <span className="ms-1 text-xs font-medium text-ink/50 dark:text-sand/50">/night</span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-ink/40 dark:text-sand/40">{th("contactForPricing")}</p>
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
