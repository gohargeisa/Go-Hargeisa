"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ListingType = "hotel" | "restaurant" | "cafe" | "attraction";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, userId: user.id };
}

export async function createTrip(
  locale: string,
  title: string,
  notes: string
): Promise<{ ok: boolean; tripId?: string; error?: string }> {
  if (!title.trim()) return { ok: false, error: "Give your trip a name." };

  try {
    const { supabase, userId } = await requireUserId();
    const { data, error } = await supabase
      .from("saved_trips")
      .insert({ user_id: userId, title: title.trim(), notes: notes.trim() || null })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath(`/${locale}/dashboard`);
    return { ok: true, tripId: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Please sign in." };
  }
}

export async function deleteTrip(locale: string, tripId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, userId } = await requireUserId();
    const { error } = await supabase.from("saved_trips").delete().eq("id", tripId).eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/${locale}/dashboard`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Please sign in." };
  }
}

/** Adds a listing to a trip. If `newTripTitle` is given, creates the trip first. */
export async function addToTrip(input: {
  locale: string;
  tripId?: string;
  newTripTitle?: string;
  listingType: ListingType;
  listingId: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, userId } = await requireUserId();

    let tripId = input.tripId;
    if (!tripId && input.newTripTitle) {
      const { data, error } = await supabase
        .from("saved_trips")
        .insert({ user_id: userId, title: input.newTripTitle.trim() })
        .select("id")
        .single();
      if (error) return { ok: false, error: error.message };
      tripId = data.id;
    }
    if (!tripId) return { ok: false, error: "Choose or create a trip." };

    const { error } = await supabase
      .from("saved_trip_items")
      .insert({ trip_id: tripId, listing_type: input.listingType, listing_id: input.listingId });
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/${input.locale}/dashboard`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Please sign in." };
  }
}

export async function removeTripItem(locale: string, itemId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase } = await requireUserId();
    const { error } = await supabase.from("saved_trip_items").delete().eq("id", itemId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/${locale}/dashboard`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Please sign in." };
  }
}

/** Returns the signed-in user's trips as { id, title } for pickers like AddToTripButton. */
export async function getMyTripOptions(): Promise<{ id: string; title: string }[]> {
  try {
    const { supabase, userId } = await requireUserId();
    const { data } = await supabase
      .from("saved_trips")
      .select("id, title")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}
