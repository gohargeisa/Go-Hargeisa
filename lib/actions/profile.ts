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

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: input.fullName.trim(), avatar_url: input.avatarUrl || null })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}`);
  return { ok: true };
}
