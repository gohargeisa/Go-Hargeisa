"use client";

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;
/** Skip compression below this size — not worth the round trip for small files. */
const MIN_SIZE_TO_COMPRESS = 400_000;

/**
 * Client-side resize/re-encode before upload, so large phone-camera photos
 * (often several MB) aren't stored and served at full size. Falls back to
 * the original file untouched on anything the canvas can't decode (SVGs) or
 * any decode/encode failure.
 */
export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));

    if (scale >= 1 && file.size < MIN_SIZE_TO_COMPRESS) {
      bitmap.close();
      return file;
    }

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
