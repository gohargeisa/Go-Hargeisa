import { HotelRoomCard } from "@/components/shared/hotel-room-card";
import type { HotelBookingCta } from "@/lib/utils/booking-cta";
import type { HotelRoom } from "@/types";

export function HotelRoomsSection({
  rooms,
  hotelId,
  hotelName,
  bookingCta,
}: {
  rooms: HotelRoom[];
  hotelId: string;
  hotelName: string;
  bookingCta: HotelBookingCta;
}) {
  if (rooms.length === 0) return null;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {rooms.map((room) => (
        <HotelRoomCard key={room.id} room={room} hotelId={hotelId} hotelName={hotelName} bookingCta={bookingCta} />
      ))}
    </div>
  );
}
