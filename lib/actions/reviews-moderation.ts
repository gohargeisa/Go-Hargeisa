"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role: string } | null)?.role !== "owner") throw new Error("Not authorized.");

  return supabase;
}

/** Admin-only — clears a business owner's report flag without deleting the review. */
export async function dismissReviewReport(
  reviewId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertAdmin();

  const { error } = await supabase.from("reviews").update({ is_reported: false } as never).eq("id", reviewId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

/** Admin-only — permanently removes a reported review. The on_review_change
 * trigger (supabase/schema.sql) recalculates the listing's rating/review_count
 * automatically. */
export async function deleteReportedReview(
  reviewId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertAdmin();

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

/** Admin-only — soft-hide: the review stops appearing on the public detail
 * page (lib/data/{hotels,restaurants,cafes,attractions,services}.ts all
 * filter status='published') but stays in the database, reversible via
 * unhideReview. This is the "only approved reviews are visible" mechanism —
 * reviews still publish instantly on submission; hiding is the moderation
 * lever, not a pre-publish queue. */
export async function hideReview(
  reviewId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertAdmin();

  const { error } = await supabase.from("reviews").update({ status: "hidden" } as never).eq("id", reviewId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

/** Admin-only — reverses hideReview. */
export async function unhideReview(
  reviewId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertAdmin();

  const { error } = await supabase.from("reviews").update({ status: "published" } as never).eq("id", reviewId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
