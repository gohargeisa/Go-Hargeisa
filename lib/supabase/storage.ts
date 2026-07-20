"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a File to a Supabase Storage bucket and returns its public URL.
 * - `listing-images` (admin-only writes) for hotel/restaurant/cafe/attraction/
 *   event/article cover photos — see supabase/schema.sql for the RLS policy.
 * - `avatars` (any signed-in user, restricted to their own user-id folder)
 *   for profile pictures.
 */
export async function uploadImage(
  file: File,
  options: { bucket: "listing-images" | "avatars"; folder: string }
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${options.folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(options.bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(options.bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** @deprecated Use `uploadImage(file, { bucket: "listing-images", folder })` instead. */
export async function uploadListingImage(file: File, folder: string): Promise<string> {
  return uploadImage(file, { bucket: "listing-images", folder });
}
