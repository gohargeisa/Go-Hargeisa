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
