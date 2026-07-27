"use client";

import { createClient } from "@/lib/supabase/client";
import { compressImageFile } from "@/lib/utils/compress-image";

/**
 * Uploads a File to a Supabase Storage bucket and returns its public URL.
 * - `listing-images` (admin-only writes) for hotel/restaurant/cafe/attraction/
 *   event/article cover photos, logos, galleries, and PDF menus — see
 *   supabase/schema.sql for the RLS policy.
 * - `avatars` (any signed-in user, restricted to their own user-id folder)
 *   for profile pictures.
 *
 * Image files are compressed client-side first (see lib/utils/compress-image.ts)
 * so every uploader in the app gets smaller uploads/downloads for free
 * without needing to know about compression itself.
 */
export async function uploadImage(
  file: File,
  options: { bucket: "listing-images" | "avatars"; folder: string }
): Promise<string> {
  const toUpload = await compressImageFile(file);
  return uploadFile(toUpload, options);
}

/** Raw upload with no compression — for non-image binaries like PDF menus. */
export async function uploadFile(
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
