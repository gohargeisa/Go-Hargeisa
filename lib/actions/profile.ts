"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(
  locale: string,
  input: { fullName: string; avatarUrl: string }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (!input.fullName.trim()) return { ok: false, error: "Name can't be empty." };

  // .update() alone returns no error when RLS silently blocks the write —
  // it just affects zero rows and looks identical to success. .select()
  // .single() forces PostgREST to return the updated row, which fails
  // loudly instead of letting a no-op show a false "Profile updated" toast.
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: input.fullName.trim(), avatar_url: input.avatarUrl || null })
    .eq("id", user.id)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Update failed — the profile was not saved." };
  }

  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}`);
  return { ok: true };
}
