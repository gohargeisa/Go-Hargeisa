import { HotelRoomCard } from "@/components/shared/hotel-room-card";
import type { HotelBookingCta } from "@/lib/utils/booking-cta";
import type { Locale } from "@/lib/i18n/config";
import type { HotelRoom } from "@/types";

export function HotelRoomsSection({
  rooms,
  locale,
  hotelId,
  hotelName,
  hotelRating,
  bookingCta,
}: {
  rooms: HotelRoom[];
  locale: Locale;
  hotelId: string;
  hotelName: string;
  hotelRating?: number;
  bookingCta: HotelBookingCta;
}) {
  if (rooms.length === 0) return null;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {rooms.map((room) => (
        <HotelRoomCard
          key={room.id}
          room={room}
          allRooms={rooms}
          locale={locale}
          hotelId={hotelId}
          hotelName={hotelName}
          hotelRating={hotelRating}
          bookingCta={bookingCta}
        />
      ))}
    </div>
  );
}
