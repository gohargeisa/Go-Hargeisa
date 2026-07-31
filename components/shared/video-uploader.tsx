"use client";

import { useRef, useState } from "react";
import { Loader2, X, Video as VideoIcon } from "lucide-react";
import { uploadVideo } from "@/lib/supabase/storage";
import type { MediaVideo } from "@/types";

/**
 * Optional short-video gallery — the Media Manager's one genuinely new media
 * type. Mirrors GalleryManager's drag & drop + multi-file UX, but simpler
 * (no categories/reordering): a video either belongs or it doesn't, and a
 * caption is the only per-clip detail worth editing.
 */
export function VideoUploader({
  folder,
  value,
  onChange,
  label,
  addLabel,
  hint,
  captionPlaceholder,
  removeAriaLabel,
}: {
  folder: string;
  value: MediaVideo[];
  onChange: (value: MediaVideo[]) => void;
  label: string;
  addLabel: string;
  hint: string;
  captionPlaceholder: string;
  removeAriaLabel: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: File[]) {
    const videoFiles = files.filter((f) => f.type.startsWith("video/"));
    if (videoFiles.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded = await Promise.all(videoFiles.map((f) => uploadVideo(f, { folder })));
      onChange([...value, ...uploaded.map((url) => ({ url }))]);
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
    void addFiles(Array.from(e.dataTransfer.files ?? []));
  }

  function updateCaption(i: number, caption: string) {
    onChange(value.map((v, idx) => (idx === i ? { ...v, caption } : v)));
  }
  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>

      {value.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {value.map((v, i) => (
            <div key={`${v.url}-${i}`} className="rounded-xl border border-ink/10 p-2.5 dark:border-white/15">
              <video src={v.url} controls preload="metadata" className="mb-2 aspect-video w-full rounded-lg bg-black" />
              <div className="flex items-center gap-2">
                <input
                  value={v.caption ?? ""}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  placeholder={captionPlaceholder}
                  className="w-full rounded-lg border border-ink/12 bg-transparent px-2.5 py-1.5 text-xs outline-none focus:border-primary dark:border-white/15"
                />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={removeAriaLabel}
                  className="shrink-0 text-ink/40 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
          accept="video/*"
          multiple
          onChange={onFilesSelected}
          className="hidden"
          id={`video-upload-${folder}`}
        />
        <label
          htmlFor={`video-upload-${folder}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <VideoIcon size={14} />}
          {uploading ? "Uploading…" : addLabel}
        </label>
        <p className="mt-1.5 text-xs text-ink/45 dark:text-sand/45">{hint}</p>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
