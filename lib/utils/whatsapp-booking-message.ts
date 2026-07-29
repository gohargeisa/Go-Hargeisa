export interface WhatsAppBookingMessageInput {
  hotelName: string;
  roomName?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  roomsCount: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  specialRequests?: string;
  bookingReference: string;
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Builds the exact WhatsApp booking-request message the spec calls for —
 * never opened empty. Every WhatsApp "Book Now" click runs the full booking
 * form through this first (see components/shared/booking-request-modal.tsx),
 * so the guest's WhatsApp message always carries the same details their
 * booking record was created with, referenced by the same booking_reference
 * the hotel owner sees in their dashboard.
 */
export function buildWhatsAppBookingMessage(input: WhatsAppBookingMessageInput): string {
  const lines = [
    `Hello ${input.hotelName},`,
    "",
    "I found your hotel on Go Hargeisa and I would like to request a booking.",
    "",
    "Booking Reference:",
    input.bookingReference,
    "",
    "Booking Details",
    "",
    "🏨 Hotel:",
    input.hotelName,
    "",
    ...(input.roomName ? ["🛏 Room:", input.roomName, ""] : []),
    "📅 Check-in:",
    formatDate(input.checkIn),
    "",
    "📅 Check-out:",
    formatDate(input.checkOut),
    "",
    "🌙 Nights:",
    String(input.nights),
    "",
    "👤 Adults:",
    String(input.adults),
    "",
    "👶 Children:",
    String(input.children),
    "",
    "🚪 Rooms:",
    String(input.roomsCount),
    "",
    "Guest Information",
    "",
    "👤 Name:",
    input.guestName,
    "",
    "📞 Phone:",
    input.guestPhone,
    ...(input.guestEmail ? ["", "📧 Email:", input.guestEmail] : []),
    ...(input.specialRequests?.trim() ? ["", "Special Requests:", "", input.specialRequests.trim()] : []),
    "",
    "Please let me know if this room is available.",
    "",
    "Thank you.",
    "",
    "Sent via Go Hargeisa",
    "www.gohargeisa.com",
  ];
  return lines.join("\n");
}
