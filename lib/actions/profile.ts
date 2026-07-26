"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BIO_MAX_LENGTH = 280;
const PHONE_PATTERN = /^[+\d][\d\s()-]{5,19}$/;

export async function updateProfile(
  locale: string,
  input: { fullName: string; avatarUrl: string; phone: string; bio: string }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const bio = input.bio.trim();

  if (!fullName) return { ok: false, error: "Name can't be empty." };
  if (fullName.length > 100) return { ok: false, error: "Name must be 100 characters or fewer." };
  if (phone && !PHONE_PATTERN.test(phone)) return { ok: false, error: "Enter a valid phone number." };
  if (bio.length > BIO_MAX_LENGTH) return { ok: false, error: `Bio must be ${BIO_MAX_LENGTH} characters or fewer.` };

  // .update() alone returns no error when RLS silently blocks the write —
  // it just affects zero rows and looks identical to success. .select()
  // .single() forces PostgREST to return the updated row, which fails
  // loudly instead of letting a no-op show a false "Profile updated" toast.
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      avatar_url: input.avatarUrl || null,
      phone: phone || null,
      bio: bio || null,
    })
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

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Not signed in." };

  if (newPassword.length < 8) return { ok: false, error: "New password must be at least 8 characters." };

  // Re-verifies the caller actually knows the current password before
  // allowing a change, rather than trusting the session alone.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) return { ok: false, error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
