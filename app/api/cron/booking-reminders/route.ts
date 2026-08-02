import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { bookingReminderEmail } from "@/lib/email/templates";
import type { Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

/**
 * Runs once a day (see vercel.json's crons entry) — emails guests whose
 * confirmed booking checks in tomorrow. Requires the standard Vercel Cron
 * bearer-token check (CRON_SECRET must be set in the Vercel project's
 * environment variables; Vercel sends it automatically as
 * `Authorization: Bearer <CRON_SECRET>` for scheduled invocations).
 * Idempotent via bookings.reminder_sent_at — safe to re-run for the same day.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, hotel_id, guest_email, check_in, booking_reference")
    .eq("status", "confirmed")
    .eq("check_in", tomorrowIso)
    .is("reminder_sent_at", null)
    .not("guest_email", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!bookings || bookings.length === 0) return NextResponse.json({ sent: 0 });

  const hotelIds = Array.from(new Set(bookings.map((b) => b.hotel_id)));
  const { data: hotels } = await supabase.from("hotels").select("id, name").in("id", hotelIds);
  const hotelNameById = new Map((hotels ?? []).map((h) => [h.id, h.name]));

  let sent = 0;
  for (const booking of bookings) {
    const hotelName = hotelNameById.get(booking.hotel_id) ?? "your hotel";
    try {
      const { subject, html } = bookingReminderEmail(
        "en" as Locale,
        hotelName,
        booking.check_in,
        booking.booking_reference ?? ""
      );
      await sendEmail({ to: booking.guest_email as string, subject, html });
      await supabase.from("bookings").update({ reminder_sent_at: new Date().toISOString() }).eq("id", booking.id);
      sent += 1;
    } catch {
      // best-effort — one failed reminder shouldn't stop the rest
    }
  }

  return NextResponse.json({ sent });
}
