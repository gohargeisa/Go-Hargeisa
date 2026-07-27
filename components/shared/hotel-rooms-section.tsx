import { HotelRoomCard } from "@/components/shared/hotel-room-card";
import type { HotelRoom } from "@/types";

export function HotelRoomsSection({
  rooms,
  website,
  phone,
}: {
  rooms: HotelRoom[];
  website?: string;
  phone?: string;
}) {
  if (rooms.length === 0) return null;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {rooms.map((room) => (
        <HotelRoomCard key={room.id} room={room} website={website} phone={phone} />
      ))}
    </div>
  );
}
