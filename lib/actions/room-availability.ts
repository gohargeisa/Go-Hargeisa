"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Rooms authorize via their PARENT hotel's owner_id — mirrors
 * lib/actions/hotel-rooms.ts's assertCanManageRoom exactly. RLS on
 * room_availability (20260802000006_booking_system_upgrade.sql's
 * predecessor, 20260729000005) is the authoritative backstop.
 */
async function assertCanManageRoom(hotelId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;

  if (role === "owner") return supabase;

  if (role === "business_owner") {
    const { data: hotel } = await supabase.from("hotels").select("owner_id").eq("id", hotelId).single();
    if ((hotel as { owner_id: string | null } | null)?.owner_id === user.id) return supabase;
  }

  throw new Error("Not authorized.");
}

/** Blocks a room for a specific date — the owner's manual override read by
 * room_capacity_available() (see the migration) alongside real bookings. */
export async function blockRoomDate(
  roomId: string,
  hotelId: string,
  date: string,
  note: string | undefined,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageRoom(hotelId);

  const { error } = await supabase
    .from("room_availability" as any)
    .upsert({ room_id: roomId, date, is_available: false, note: note || null } as never, { onConflict: "room_id,date" });

  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function unblockRoomDate(
  roomId: string,
  hotelId: string,
  date: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageRoom(hotelId);

  const { error } = await supabase.from("room_availability" as any).delete().eq("room_id", roomId).eq("date", date);

  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
