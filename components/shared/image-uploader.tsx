"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, Loader2, X, ImageIcon } from "lucide-react";
import { uploadImage } from "@/lib/supabase/storage";

export function ImageUploader({
  folder,
  value,
  onChange,
  label = "Cover image",
  bucket = "listing-images",
  rounded = "rounded-xl",
}: {
  folder: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
  bucket?: "listing-images" | "avatars";
  rounded?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `upload-${bucket}-${folder}`;

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file, { bucket, folder });
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void upload(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={`flex items-center gap-4 rounded-xl2 border-2 border-dashed p-3 transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-transparent"
        }`}
      >
        <div className={`relative h-24 w-24 shrink-0 overflow-hidden ${rounded} border border-ink/10 dark:border-white/15 bg-ink/5 dark:bg-white/5`}>
          {value ? (
            <Image src={value} alt="Preview" fill sizes="96px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink/30">
              <ImageIcon size={22} />
            </div>
          )}
        </div>
        <div>
          <input ref={inputRef} type="file" accept="image/*" onChange={onFileSelected} className="hidden" id={inputId} />
          <label
            htmlFor={inputId}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 dark:border-white/20 px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="ms-2 inline-flex items-center gap-1 text-xs text-ink/50 hover:text-red-500"
            >
              <X size={12} /> Remove
            </button>
          )}
          <p className="mt-1.5 text-xs text-ink/45 dark:text-sand/45">
            Drag & drop or click to upload (<code>{bucket}</code> bucket). JPG/PNG/WebP.
          </p>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      </div>
      {/* Hidden field so this still works inside a plain &lt;form action={serverAction}&gt; */}
      <input type="hidden" name="coverImage" value={value} />
    </div>
  );
}
