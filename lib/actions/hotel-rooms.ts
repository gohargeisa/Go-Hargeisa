"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RoomType } from "@/types";

export interface HotelRoomInput {
  name: string;
  image?: string;
  images?: string[];
  description?: string;
  sizeSqm?: number;
  maxGuests: number;
  bedType?: string;
  bathrooms?: number;
  features: string[];
  pricePerNight?: number;
  weekendPrice?: number;
  discountPrice?: number;
  totalRooms?: number;
  sortOrder?: number;
  roomType: RoomType;
  isAvailable: boolean;
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
    description: input.description || null,
    size_sqm: input.sizeSqm ?? null,
    max_guests: input.maxGuests,
    bed_type: input.bedType || null,
    bathrooms: input.bathrooms ?? 1,
    features: input.features,
    price_per_night: input.pricePerNight ?? null,
    weekend_price: input.weekendPrice ?? null,
    discount_price: input.discountPrice ?? null,
    total_rooms: input.totalRooms ?? 1,
    sort_order: input.sortOrder ?? 0,
    room_type: input.roomType,
    is_available: input.isAvailable,
  };
}

/** Replaces a room's gallery wholesale — simplest correct sync for a small
 * per-room image list, avoids diffing add/remove/reorder as three separate
 * operations. Best-effort: a gallery write failure doesn't roll back the
 * room save itself. */
async function syncRoomImages(supabase: Awaited<ReturnType<typeof assertCanManageRoom>>, roomId: string, images?: string[]) {
  if (images === undefined) return;
  await supabase.from("room_images" as any).delete().eq("room_id", roomId);
  if (images.length === 0) return;
  await supabase.from("room_images" as any).insert(
    images.map((url, i) => ({ room_id: roomId, url, sort_order: i })) as never
  );
}

export async function createHotelRoom(
  hotelId: string,
  input: HotelRoomInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageRoom(hotelId);

  const { data, error } = await supabase.from("hotel_rooms" as any).insert(toPayload(input, hotelId) as never).select("id").single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not create room." };

  await syncRoomImages(supabase, (data as { id: string }).id, input.images);

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

  await syncRoomImages(supabase, roomId, input.images);

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
