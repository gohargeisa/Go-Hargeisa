import type { Database } from "@/types/database";
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export async function subscribeToNewsletter(email: string, locale: string): Promise<{ ok: boolean; error?: string }> {
  if (!email || !email.includes("@")) return { ok: false, error: "Enter a valid email address." };

  if (!isSupabaseConfigured()) {
    console.log(`[newsletter] (Supabase not connected — logging only) ${email} / ${locale}`);
    return { ok: true };
  }

  const supabase = await createClient();
  
  const { error } = await supabase
  .from("newsletter_subscribers")
  .insert([
    {
      email,
      locale,
    },
  ]);
  // Unique-violation on the email column just means they're already subscribed — treat as success.
  if (error && error.code !== "23505") {
    console.error("subscribeToNewsletter:", error.message);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  return { ok: true };
}

export async function sendContactMessage(input: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.name || !input.email || !input.message) {
    return { ok: false, error: "Please fill in all required fields." };
  }

  if (!isSupabaseConfigured()) {
    console.log("[contact] (Supabase not connected — logging only)", input);
    return { ok: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert(input);
  if (error) {
    console.error("sendContactMessage:", error.message);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  return { ok: true };
}

type ListingType = "hotel" | "restaurant" | "cafe" | "attraction";

export async function submitReview(input: {
  listingType: ListingType;
  listingId: string;
  rating: number;
  comment: string;
  locale: string;
  pathToRevalidate: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Reviews require a connected Supabase project." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Please sign in to leave a review." };
  if (input.rating < 1 || input.rating > 5) return { ok: false, error: "Rating must be between 1 and 5." };

  const { error } = await supabase.from("reviews").insert({
    listing_type: input.listingType,
    listing_id: input.listingId,
    user_id: user.id,
    rating: input.rating,
    comment: input.comment,
  });

  if (error) {
    console.error("submitReview:", error.message);
    return { ok: false, error: "Could not submit your review. Please try again." };
  }

  revalidatePath(input.pathToRevalidate);
  return { ok: true };
}

export async function deleteReview(
  locale: string,
  reviewId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Not configured." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in." };

  // RLS also enforces this (users can only delete their own reviews), the
  // explicit .eq("user_id", ...) here just avoids a confusing "0 rows
  // affected" no-op if someone tampers with the reviewId.
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId).eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/${locale}/dashboard`);
  return { ok: true };
}
