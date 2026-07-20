"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ListingType = "hotel" | "restaurant" | "cafe" | "attraction";

export async function toggleFavoriteAction(
  listingType: ListingType,
  listingId: string,
  pathToRevalidate?: string
): Promise<{ ok: boolean; favorited?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "sign-in-required" };

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    if (pathToRevalidate) revalidatePath(pathToRevalidate);
    return { ok: true, favorited: false };
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, listing_type: listingType, listing_id: listingId });

  if (error) return { ok: false, error: error.message };
  if (pathToRevalidate) revalidatePath(pathToRevalidate);
  return { ok: true, favorited: true };
}
