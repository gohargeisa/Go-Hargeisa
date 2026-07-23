"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateUserRole(
  locale: string,
  userId: string,
  role: "user" | "business_owner" | "owner"
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") return { ok: false, error: "Not authorized." };

  if (userId === user.id && role !== "owner") {
    return { ok: false, error: "You can't remove your own owner access." };
  }

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/${locale}/admin/users`);
  return { ok: true };
}
