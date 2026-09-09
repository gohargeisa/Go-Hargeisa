/**
 * The signed-in user's own bookings — hotel bookings, table reservations
 * (restaurants/cafes), and appointments. Direct Supabase reads scoped by
 * RLS (`user_id = auth.uid()`), mirroring the website's dashboard exactly:
 * lib/data/business.ts's getMyBookings/getMyAppointments and
 * lib/data/reservations.ts's getMyTableReservations. Same tables, same
 * policies — no new backend surface.
 */
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/supabase-provider";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface MyHotelBooking {
  id: string;
  hotelName: string;
  hotelSlug: string;
  roomName?: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  status: BookingStatus;
  createdAt: string;
}

export function useMyHotelBookings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-hotel-bookings", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<MyHotelBooking[]> => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, check_in, check_out, guests_count, status, created_at, hotel_rooms(name), hotels(name, slug)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        hotelName: row.hotels?.name ?? "",
        hotelSlug: row.hotels?.slug ?? "",
        roomName: row.hotel_rooms?.name ?? undefined,
        checkIn: row.check_in,
        checkOut: row.check_out,
        guestsCount: row.guests_count,
        status: row.status,
        createdAt: row.created_at,
      }));
    },
  });
}

export type TableReservationListingKind = "restaurant" | "cafe" | "service";

export interface MyTableReservation {
  id: string;
  listingType: TableReservationListingKind;
  businessName: string;
  reservationDate: string;
  reservationTime: string;
  guestsCount: number;
  status: BookingStatus;
  createdAt: string;
}

export function useMyTableReservations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-table-reservations", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<MyTableReservation[]> => {
      const { data, error } = await supabase
        .from("table_reservations")
        .select("*")
        .eq("user_id", user!.id)
        .order("reservation_date", { ascending: false })
        .order("reservation_time", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as any[];

      const idsByType: Record<TableReservationListingKind, string[]> = {
        restaurant: [],
        cafe: [],
        service: [],
      };
      for (const r of rows) {
        const kind = r.listing_type as TableReservationListingKind;
        idsByType[kind]?.push(r.listing_id);
      }

      const [restaurantRows, cafeRows, serviceRows] = await Promise.all([
        idsByType.restaurant.length
          ? supabase.from("restaurants").select("id, name").in("id", idsByType.restaurant)
          : Promise.resolve({ data: [] as any[] }),
        idsByType.cafe.length
          ? supabase.from("cafes").select("id, name").in("id", idsByType.cafe)
          : Promise.resolve({ data: [] as any[] }),
        idsByType.service.length
          ? supabase.from("services").select("id, name").in("id", idsByType.service)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const nameById = new Map<string, string>();
      for (const r of [...(restaurantRows.data ?? []), ...(cafeRows.data ?? []), ...(serviceRows.data ?? [])]) {
        nameById.set(r.id, r.name);
      }

      return rows.map((row) => ({
        id: row.id,
        listingType: row.listing_type,
        businessName: nameById.get(row.listing_id) ?? "",
        reservationDate: row.reservation_date,
        reservationTime: row.reservation_time,
        guestsCount: row.guests_count,
        status: row.status,
        createdAt: row.created_at,
      }));
    },
  });
}

export interface MyAppointment {
  id: string;
  doctorName: string;
  hospitalName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: BookingStatus;
  createdAt: string;
}

export function useMyAppointments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-appointments", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<MyAppointment[]> => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, appointment_date, appointment_time, status, created_at, doctors(name, city_services(name))")
        .eq("user_id", user!.id)
        .order("appointment_date", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as any[]).map((row) => ({
        id: row.id,
        doctorName: row.doctors?.name ?? "",
        hospitalName: row.doctors?.city_services?.name ?? "",
        appointmentDate: row.appointment_date,
        appointmentTime: row.appointment_time,
        status: row.status,
        createdAt: row.created_at,
      }));
    },
  });
}
