"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface HotelRoomInput {
  name: string;
  image?: string;
  sizeSqm?: number;
  maxGuests: number;
  bedType?: string;
  features: string[];
  pricePerNight?: number;
  sortOrder?: number;
}

/**
 * Rooms authorize via their PARENT hotel's owner_id, not a column of their
 * own — so this checks profiles.role + hotels.owner_id directly rather than
 * reusing lib/actions/admin.ts's generic assertOwner (which only knows about
 * ALLOWED_TABLES rows that own their own owner_id column). RLS on
 * hotel_rooms mirrors this same check server-side as the authoritative gate.
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

function toPayload(input: HotelRoomInput, hotelId: string) {
  return {
    hotel_id: hotelId,
    name: input.name,
    image: input.image || null,
    size_sqm: input.sizeSqm ?? null,
    max_guests: input.maxGuests,
    bed_type: input.bedType || null,
    features: input.features,
    price_per_night: input.pricePerNight ?? null,
    sort_order: input.sortOrder ?? 0,
  };
}

export async function createHotelRoom(
  hotelId: string,
  input: HotelRoomInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageRoom(hotelId);

  const { error } = await supabase.from("hotel_rooms" as any).insert(toPayload(input, hotelId) as never);

  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function updateHotelRoom(
  roomId: string,
  hotelId: string,
  input: HotelRoomInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageRoom(hotelId);

  const { error } = await supabase
    .from("hotel_rooms" as any)
    .update({ ...toPayload(input, hotelId), updated_at: new Date().toISOString() } as never)
    .eq("id", roomId);

  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function deleteHotelRoom(
  roomId: string,
  hotelId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageRoom(hotelId);

  const { error } = await supabase.from("hotel_rooms" as any).delete().eq("id", roomId);

  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
