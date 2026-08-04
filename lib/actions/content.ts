import type { Database } from "@/types/database";
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { PolymorphicListingType } from "@/types";

export async function subscribeToNewsletter(email: string, locale: string): Promise<{ ok: boolean; error?: string }> {
  if (!email || !email.includes("@")) return { ok: false, error: "Enter a valid email address." };

  if (!isSupabaseConfigured()) {
    // Supabase not configured - newsletter subscription simulated
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
    if (process.env.NODE_ENV === "development") console.error("subscribeToNewsletter:", error.message);
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
    // Supabase not configured - contact form submission simulated
    return { ok: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert(input);
  if (error) {
    if (process.env.NODE_ENV === "development") console.error("sendContactMessage:", error.message);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  return { ok: true };
}

type ListingType = PolymorphicListingType;

export async function submitReview(input: {
  listingType: ListingType;
  listingId: string;
  rating: number;
  comment: string;
  title?: string;
  visitDate?: string;
  locale: string;
  pathToRevalidate: string;
  photos?: string[];
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
    title: input.title || null,
    visit_date: input.visitDate || null,
    photos: (input.photos ?? []).map((url) => ({ url })),
  } as never);

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("submitReview:", error.message);
    // 23505 = unique_violation — reviews_user_listing_unique (one review per user per listing).
    if (error.code === "23505") return { ok: false, error: "You've already reviewed this listing — edit your existing review instead." };
    return { ok: false, error: "Could not submit your review. Please try again." };
  }

  revalidatePath(input.pathToRevalidate);
  return { ok: true };
}

/** Edits the signed-in user's own review — RLS's "Users update own reviews"
 * policy (auth.uid() = user_id) is the authoritative check; the explicit
 * .eq("user_id", ...) here just avoids a confusing silent no-op if someone
 * tampers with the reviewId. */
export async function updateReview(input: {
  reviewId: string;
  rating: number;
  comment: string;
  title?: string;
  visitDate?: string;
  locale: string;
  pathToRevalidate: string;
  photos?: string[];
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Reviews require a connected Supabase project." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Please sign in to edit your review." };
  if (input.rating < 1 || input.rating > 5) return { ok: false, error: "Rating must be between 1 and 5." };

  const { error } = await supabase
    .from("reviews")
    .update({
      rating: input.rating,
      comment: input.comment,
      title: input.title || null,
      visit_date: input.visitDate || null,
      photos: (input.photos ?? []).map((url) => ({ url })),
    } as never)
    .eq("id", input.reviewId)
    .eq("user_id", user.id);

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("updateReview:", error.message);
    return { ok: false, error: "Could not update your review. Please try again." };
  }

  revalidatePath(input.pathToRevalidate);
  return { ok: true };
}

export async function deleteReview(
  locale: string,
  reviewId: string,
  extraPathToRevalidate?: string
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
  if (extraPathToRevalidate) revalidatePath(extraPathToRevalidate);
  return { ok: true };
}

/** Per-user-once "helpful" vote — mirrors toggleFavoriteAction's exact
 * shape/pattern (lib/actions/favorites.ts). helpful_count on the review
 * itself is denormalized and synced by a DB trigger, not written here. */
export async function toggleHelpfulVote(
  reviewId: string,
  pathToRevalidate?: string
): Promise<{ ok: boolean; helpful?: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Not configured." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign-in-required" };

  const { data: existing } = await supabase
    .from("review_helpful_votes")
    .select("id")
    .eq("user_id", user.id)
    .eq("review_id", reviewId)
    .maybeSingle();

  if (existing) {
    await supabase.from("review_helpful_votes").delete().eq("id", existing.id);
    if (pathToRevalidate) revalidatePath(pathToRevalidate);
    return { ok: true, helpful: false };
  }

  const { error } = await supabase.from("review_helpful_votes").insert({ user_id: user.id, review_id: reviewId });
  if (error) return { ok: false, error: error.message };
  if (pathToRevalidate) revalidatePath(pathToRevalidate);
  return { ok: true, helpful: true };
}

/** Visitor-facing "Report this review" — distinct from the owner/admin-only
 * reportReview in lib/actions/business.ts (which requires
 * assertCanManageListing, so a regular visitor can't call it — RLS only
 * grants review UPDATE to the review's own author, the listing's owner, or
 * an admin). Goes through the narrow `report_review` SECURITY DEFINER RPC
 * (see migration 20260803000011) instead of a direct table update, so a
 * visitor can flip only the `is_reported` flag without gaining general
 * UPDATE access to other people's reviews. The review stays publicly
 * visible until an admin acts on it (lib/actions/reviews-moderation.ts). */
export async function reportReviewAsVisitor(
  reviewId: string,
  pathToRevalidate?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Not configured." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign-in-required" };

  const { error } = await supabase.rpc("report_review", { p_review_id: reviewId });
  if (error) return { ok: false, error: error.message };
  if (pathToRevalidate) revalidatePath(pathToRevalidate);
  return { ok: true };
}
