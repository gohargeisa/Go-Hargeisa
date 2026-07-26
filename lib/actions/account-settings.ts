"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateNotificationPreferences(
  locale: string,
  input: { notifyActivity: boolean; notifyMarketing: boolean }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data, error } = await supabase
    .from("profiles")
    .update({ notify_activity: input.notifyActivity, notify_marketing: input.notifyMarketing })
    .eq("id", user.id)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Update failed — your preferences were not saved." };
  }

  revalidatePath(`/${locale}/dashboard`);
  return { ok: true };
}

/**
 * Permanently deletes the signed-in user's own account. Requires the
 * SUPABASE_SERVICE_ROLE_KEY-backed admin client (lib/supabase/admin.ts)
 * because deleting an auth.users row isn't something even that row's own
 * session can do via the anon/cookie-based client — only a service role
 * (or the Supabase dashboard) can. The profiles row, and everything that
 * references it (favorites, saved_trips, reviews — all `on delete
 * cascade`, see supabase/schema.sql), is removed automatically as part of
 * deleting the auth user.
 */
export async function deleteAccount(confirmationText: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (confirmationText.trim().toUpperCase() !== "DELETE") {
    return { ok: false, error: 'Type "DELETE" to confirm.' };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
