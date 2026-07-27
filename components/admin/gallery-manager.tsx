"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, GripVertical, Loader2, Repeat, Upload, X } from "lucide-react";
import { uploadImage } from "@/lib/supabase/storage";
import type { GalleryCategoryOption } from "@/lib/utils/gallery-categories";
import type { GalleryImage } from "@/types";

/**
 * Multi-image gallery uploader with per-photo category tagging, drag & drop
 * upload, drag-to-reorder, and per-photo replace — shared by the hotel,
 * restaurant, and cafe admin forms (each passes its own `categories` list
 * from lib/utils/gallery-categories.ts). Closes the gap where those forms
 * used to hardcode `gallery: []` because no UI existed to manage it.
 */
export function GalleryManager({
  folder,
  value,
  onChange,
  categories,
}: {
  folder: string;
  value: GalleryImage[];
  onChange: (value: GalleryImage[]) => void;
  categories: GalleryCategoryOption[];
}) {
  const [uploading, setUploading] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: File[]) {
    if (files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map((f) => uploadImage(f, { bucket: "listing-images", folder })));
      onChange([...value, ...uploaded.map((url) => ({ url, category: "other" }))]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    await addFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files ?? []).filter((f) => f.type.startsWith("image/"));
    void addFiles(files);
  }

  async function onReplaceSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const i = replacingIndex;
    if (!file || i === null) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file, { bucket: "listing-images", folder });
      updateAt(i, { url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      setReplacingIndex(null);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  }

  function updateAt(i: number, patch: Partial<GalleryImage>) {
    onChange(value.map((img, idx) => (idx === i ? { ...img, ...patch } : img)));
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  function reorderTo(from: number, to: number) {
    if (from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">Photo gallery</label>

      {value.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {value.map((img, i) => (
            <div
              key={`${img.url}-${i}`}
              draggable
              onDragStart={() => setDraggedIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIndex !== null) reorderTo(draggedIndex, i);
                setDraggedIndex(null);
              }}
              onDragEnd={() => setDraggedIndex(null)}
              className={`flex items-center gap-2 rounded-xl border border-ink/10 p-2.5 dark:border-white/15 ${
                draggedIndex === i ? "opacity-40" : ""
              }`}
            >
              <span className="shrink-0 cursor-grab text-ink/25 active:cursor-grabbing" aria-hidden="true">
                <GripVertical size={15} />
              </span>
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink/5 dark:bg-white/5">
                <Image src={img.url} alt={img.alt || ""} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <select
                  value={img.category ?? "other"}
                  onChange={(e) => updateAt(i, { category: e.target.value })}
                  className="w-full rounded-lg border border-ink/12 bg-transparent px-2 py-1.5 text-xs outline-none focus:border-primary dark:border-white/15"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex shrink-0 flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move photo earlier"
                  className="text-ink/40 hover:text-primary disabled:opacity-30"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  aria-label="Move photo later"
                  className="text-ink/40 hover:text-primary disabled:opacity-30"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReplacingIndex(i);
                  replaceInputRef.current?.click();
                }}
                aria-label="Replace photo"
                className="shrink-0 text-ink/40 hover:text-primary"
              >
                <Repeat size={15} />
              </button>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove photo"
                className="shrink-0 text-ink/40 hover:text-red-500"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        onChange={onReplaceSelected}
        className="hidden"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={`rounded-xl2 border-2 border-dashed p-4 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-ink/15 dark:border-white/15"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onFilesSelected}
          className="hidden"
          id={`gallery-upload-${folder}`}
        />
        <label
          htmlFor={`gallery-upload-${folder}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? "Uploading…" : "Add photos"}
        </label>
        <p className="mt-1.5 text-xs text-ink/45 dark:text-sand/45">
          Drag & drop photos here, or click to browse. Tag each with a category so it appears in the right part of
          the gallery.
        </p>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
